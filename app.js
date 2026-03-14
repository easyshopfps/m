// Easy Karaoke — app.js (logic only, dictionary loaded separately)

// Global dict assembled from chunks
window.fullKaraokeToLao = {};
const _dictChunks = ['lao1','lao2','lao3','kar_abc','kar_defj','kar_klm','kar_nz'];
let _loadedChunks = 0;

window._dictLoaded = function(suffix) {
  const chunk = window['_dict_' + suffix];
  if (chunk) Object.assign(window.fullKaraokeToLao, chunk);
  _loadedChunks++;
  if (_loadedChunks === _dictChunks.length) {
    window._dictReady = true;
    document.dispatchEvent(new Event('dictready'));
  }
};



    /* ── Translation core ── */
    /* ── Stagger reveal ── */
    function reveal(el, text) {
      el.innerHTML='';
      el.classList.remove('reveal');
      void el.offsetWidth;
      el.classList.add('reveal');
      [...text].forEach((ch,i)=>{
        const s=document.createElement('span');
        s.textContent=ch;
        s.style.animationDelay=Math.min(i*16,500)+'ms';
        el.appendChild(s);
      });
    }

    /* ── Click sound ── */
    function click_sfx(){
      try{
        const ac=new(window.AudioContext||window.webkitAudioContext)();
        const o=ac.createOscillator(),g=ac.createGain();
        o.connect(g);g.connect(ac.destination);
        o.frequency.setValueAtTime(900,ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(500,ac.currentTime+.07);
        g.gain.setValueAtTime(.06,ac.currentTime);
        g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.09);
        o.start();o.stop(ac.currentTime+.09);
      }catch(e){}
    }

    /* ── Panel flash ── */
    function flashPanel(){
      const p=document.getElementById('mainPanel');
      p.classList.add('flash');
      setTimeout(()=>p.classList.remove('flash'),700);
    }

    /* ══════════════════════════════════════════
       TRANSLATION ENGINE
       1. Dictionary lookup (longest match)
       2. Phonetic rules fallback for unknown words
    ══════════════════════════════════════════ */

    const LAO_CONS = {
      'ກ':'k',      'ຂ':'kh',      'ຄ':'kh',      'ງ':'ng',      'ຈ':'ch',      'ສ':'s',      'ຊ':'x',      'ຍ':'ny',      'ດ':'d',      'ຕ':'t',      'ຖ':'th',      'ທ':'th',      'ນ':'n',      'ບ':'b',      'ປ':'p',      'ຜ':'ph',      'ຝ':'f',      'ພ':'ph',      'ຟ':'f',      'ມ':'m',      'ຢ':'y',      'ລ':'l',      'ວ':'v',      'ຫ':'h',      'ຮ':'h',
      'ໜ':'n','ໝ':'m','ຫນ':'n','ຫມ':'m','ຫງ':'ng','ຫຍ':'ny','ຫລ':'l','ຫຼ':'l','ຫວ':'v',
    };
    const LAO_VOW = {
      'ະ':'a','າ':'a','ິ':'i','ີ':'i','ຶ':'ue','ື':'ue',
      'ຸ':'u','ູ':'u','ເ':'e','ແ':'ae','ໂ':'o','ໃ':'ai','ໄ':'ai',
      'ົ':'o','ໍ':'or','ຳ':'am','ຽ':'ia','ົວ':'ua',
    };
    const KARA_CONS_LIST = [
      ['kh','ຂ'],['ng','ງ'],['ny','ຍ'],['th','ທ'],['ph','ພ'],
      ['ch','ຊ'],['sh','ສ'],
      ['k','ກ'],['j','ຈ'],['s','ສ'],['z','ຊ'],['d','ດ'],['t','ຕ'],
      ['n','ນ'],['b','ບ'],['p','ປ'],['f','ຝ'],['m','ມ'],['y','ຢ'],
      ['l','ລ'],['h','ຫ'],['v','ວ'],['r','ຣ'],['w','ວ'],['g','ກ'],
    ];
    const KARA_VOW_LIST = [
      ['ae','ແ'],['ai','ໄ'],['ao','ເາ'],['am','ຳ'],['ue','ຶ'],
      ['ia','ຽ'],['ua','ົວ'],['or','ໍ'],['er','ເີ'],
      ['a','າ'],['e','ເ'],['i','ິ'],['o','ໂ'],['u','ຸ'],
    ];

    function laoWordToKaraoke(word) {
      let result = '';
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        if (LAO_CONS.hasOwnProperty(ch)) { result += LAO_CONS[ch]; continue; }
        if (LAO_VOW.hasOwnProperty(ch)) { result += LAO_VOW[ch]; continue; }
        const cp = ch.codePointAt(0);
        if (cp >= 0x0EC8 && cp <= 0x0ECB) continue; // skip tone marks
        result += /[຀-໿]/.test(ch) ? ch : ch;
      }
      return result || word;
    }

    function karaokeWordToLao(word) {
      let result = '', i = 0;
      const w = word.toLowerCase();
      while (i < w.length) {
        let matched = false;
        for (const [rom, lao] of KARA_CONS_LIST) {
          if (w.substr(i, rom.length) === rom) { result += lao; i += rom.length; matched = true; break; }
        }
        if (!matched) {
          for (const [rom, lao] of KARA_VOW_LIST) {
            if (w.substr(i, rom.length) === rom) { result += lao; i += rom.length; matched = true; break; }
          }
        }
        if (!matched) result += w[i++];
      }
      return result || word;
    }

    function smartTranslate(text, dir) {
      const keys = Object.keys(window.fullKaraokeToLao || {}).sort((a,b) => b.length - a.length);
      const lower = text.toLowerCase();

      if (dir === 'karaoke-to-lao') {
        let r = '', i = 0;
        while (i < lower.length) {
          if (/\s/.test(lower[i])) { i++; continue; }
          let hit = false;
          for (const k of keys) {
            if (lower.substr(i, k.length) === k) { r += fullKaraokeToLao[k]; i += k.length; hit = true; break; }
          }
          if (!hit) {
            let j = i;
            while (j < lower.length && !/\s/.test(lower[j])) j++;
            r += karaokeWordToLao(lower.slice(i, j));
            i = j;
          }
        }
        return r;
      }

      // lao → karaoke
      let r = '', i = 0;
      while (i < lower.length) {
        if (/\s/.test(lower[i])) { r += lower[i++]; continue; }
        let hit = false;
        for (const k of keys) {
          if (lower.substr(i, k.length) === k) {
            if (r && !/\s/.test(r[r.length-1])) r += ' ';
            r += window.fullKaraokeToLao[k]; i += k.length; hit = true; break;
          }
        }
        if (!hit) {
          let j = i;
          while (j < lower.length && !/\s/.test(lower[j])) j++;
          if (r && !/\s/.test(r[r.length-1])) r += ' ';
          r += laoWordToKaraoke(text.slice(i, j));
          i = j;
        }
      }
      return r.trim();
    }

    /* ── Translate ── */
    let rtTimer = null;
    function translateText() {
      const inp = document.getElementById('inputText').value.trim();
      const out = document.getElementById('output');
      const bar = document.getElementById('loadingBar');
      const copyBtn = document.getElementById('copyBtn');
      const ring = document.getElementById('inputRing');
      const dir = document.getElementById('direction').value;

      if (!inp) {
        out.innerHTML = '<span class="ph">— ຜົນການແປຈະປາກົດທີ່ນີ້ —</span>';
        copyBtn.style.display = 'none';
        return;
      }
      const hasLao = /[຀-໿]/.test(inp);
      if (dir === 'karaoke-to-lao' && hasLao) {
        out.innerHTML = '';
        reveal(out, inp);
        copyBtn.style.display = 'inline-flex';
        return;
      }
      bar.style.display = 'block';
      ring.classList.add('loading');
      out.innerHTML = '';
      copyBtn.style.display = 'none';
      click_sfx();
      clearTimeout(rtTimer);
      rtTimer = setTimeout(() => {
        const res = smartTranslate(inp, dir);
        bar.style.display = 'none';
        ring.classList.remove('loading');
        if (res && res.trim()) {
          reveal(out, res);
          copyBtn.style.display = 'inline-flex';
          flashPanel();
        } else {
          out.innerHTML = '<span class="ph">— ບໍ່ພົບຜົນການແປ —</span>';
        }
      }, 200);
    }

    /* ── Direction with spinning arrow ── */
    function setDir(dir,el){
      document.getElementById('direction').value=dir;
      document.querySelectorAll('.dir-btn').forEach(b=>b.classList.remove('active','spin'));
      el.classList.add('active');
      // spin the arrow on the clicked button
      void el.offsetWidth;
      el.classList.add('spin');
      el.addEventListener('animationend',()=>el.classList.remove('spin'),{once:true});
      if(document.getElementById('inputText').value.trim())translateText();
    }

    /* ── Theme toggle with icon ── */
    const themeBtn=document.getElementById('themeBtn');
    const themeIcon=document.getElementById('themeIcon');
    function applyTheme(light){
      document.documentElement.setAttribute('data-theme',light?'light':'dark');
      themeIcon.textContent = light ? '☀️' : '🌙';
      themeIcon.style.transform='rotate(360deg)';
      setTimeout(()=>themeIcon.style.transform='',400);
      try{localStorage.setItem('theme',light?'light':'dark');}catch(e){}
    }
    themeBtn.addEventListener('click',()=>{
      applyTheme(document.documentElement.getAttribute('data-theme')!=='light');
      click_sfx();
    });
    try{
      const s=localStorage.getItem('theme');
      const p=window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(s?s==='light':p);
    }catch(e){applyTheme(false);}

    /* ── Realtime + char count ── */
    let rtDelay=null;
    document.getElementById('inputText').addEventListener('input',function(){
      document.getElementById('charPill').textContent=this.value.length;
      clearTimeout(rtDelay);
      rtDelay=setTimeout(()=>{if(this.value.trim())translateText();},380);
    });
    document.getElementById('inputText').addEventListener('keydown',function(e){
      if(e.ctrlKey&&e.key==='Enter'){e.preventDefault();translateText();}
    });

    /* ── Splash screen ── */
    (function(){
      const word = 'EASY KARAOKE';
      const container = document.getElementById('splashLetters');
      if(!container) return;
      [...word].forEach((ch,i)=>{
        const s = document.createElement('span');
        s.textContent = ch === ' ' ? '\u00A0' : ch;
        s.style.animationDelay = (0.2 + i * 0.06) + 's';
        container.appendChild(s);
      });

      function hideSplash(){
        const splash = document.getElementById('splash');
        if(splash) splash.classList.add('hide');
      }

      // Hide when ALL dictionary chunks loaded + minimum 2s animation
      let minDone = false, dictDone = false;
      function tryHide(){ if(minDone && dictDone) hideSplash(); }

      setTimeout(()=>{ minDone = true; tryHide(); }, 2000);

      document.addEventListener('dictready', ()=>{ dictDone = true; tryHide(); });
      // Safety fallback: never stuck
      setTimeout(hideSplash, 15000);
    })();
