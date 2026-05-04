(function(){const h=/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?(.*)$/;function f(){const e=window.location.href.match(h);if(!e)return null;const[,t,n,r]=e;if(new Set(["settings","notifications","explore","topics","trending","collections","events","sponsors","marketplace","pulls","issues","codespaces","features","security","pricing","enterprise","login","signup","join","new","organizations","orgs"]).has(t))return null;let a="main";if(r){const s=r.match(/^tree\/([^/]+)/);s&&(a=s[1])}return{owner:t,repo:n,branch:a,url:window.location.href}}function x(e){var t,n,r,o;try{const a=document.querySelector('[data-testid="about-description"], .f4.my-3, p.f4.my-3');a&&(e.description=(t=a.textContent)==null?void 0:t.trim());const s=document.querySelector('#repo-stars-counter-star, a[href$="/stargazers"] .Counter, a[href$="/stargazers"] span');if(s){const c=((n=s.textContent)==null?void 0:n.trim().replace(/,/g,""))??"0",i=parseFloat(c);c.endsWith("k")?e.stars=Math.round(i*1e3):e.stars=Math.round(i)}const u=document.querySelector('#repo-network-counter, a[href$="/forks"] .Counter, a[href$="/forks"] span');if(u){const c=((r=u.textContent)==null?void 0:r.trim().replace(/,/g,""))??"0",i=parseFloat(c);c.endsWith("k")?e.forks=Math.round(i*1e3):e.forks=Math.round(i)}const m=document.querySelector('.BorderGrid-cell [itemprop="programmingLanguage"], .repository-lang-stats-graph .language-color + span');m&&(e.language=(o=m.textContent)==null?void 0:o.trim());const g=document.querySelectorAll('a.topic-tag, a[data-octo-click="topic_click"]');g.length>0&&(e.topics=Array.from(g).map(c=>{var i;return((i=c.textContent)==null?void 0:i.trim())??""}).filter(Boolean))}catch{}return e}const p="repomind-scan-button";function b(e){if(document.getElementById(p))return;const t=document.createElement("div");t.id=p,t.innerHTML=`
    <button id="repomind-scan-btn" aria-label="Scan with RepoMind">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
      <span>Scan Repo</span>
    </button>
  `;const n=t.attachShadow({mode:"open"}),r=document.createElement("style");r.textContent=`
    :host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(99, 102, 241, 0.4), 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
    }

    button:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.5), 0 4px 12px rgba(0,0,0,0.15);
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
    }

    button:active {
      transform: translateY(0) scale(0.98);
    }

    button svg {
      flex-shrink: 0;
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 4px 24px rgba(99, 102, 241, 0.4); }
      50% { box-shadow: 0 4px 32px rgba(99, 102, 241, 0.6); }
    }

    button.scanning {
      animation: pulse 2s ease-in-out infinite;
      pointer-events: none;
      opacity: 0.8;
    }

    button.scanning span::after {
      content: '...';
      animation: dots 1.5s steps(3) infinite;
    }

    @keyframes dots {
      0% { content: ''; }
      33% { content: '.'; }
      66% { content: '..'; }
      100% { content: '...'; }
    }
  `;const o=document.createElement("button");o.innerHTML=`
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    <span>Scan Repo</span>
  `,o.addEventListener("click",()=>{o.classList.add("scanning"),o.querySelector("span").textContent="Scanning",chrome.runtime.sendMessage({type:"START_ANALYSIS",payload:e}),setTimeout(()=>{o.classList.remove("scanning"),o.querySelector("span").textContent="Scan Repo"},5e3)}),n.appendChild(r),n.appendChild(o),document.body.appendChild(t)}function y(){var e;(e=document.getElementById(p))==null||e.remove()}function w(e){try{const t=document.querySelector(".pagehead-actions, .file-navigation, [data-testid='repo-header']");if(!t||document.getElementById("repomind-badges"))return;const n=document.createElement("div");n.id="repomind-badges";const r=n.attachShadow({mode:"open"}),o=document.createElement("style");o.textContent=`
      :host {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-left: 8px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .score-badge {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
      }
    `;const a=document.createElement("div");if(a.style.display="inline-flex",a.style.alignItems="center",a.style.gap="6px",e.contributionScore!==void 0){const s=document.createElement("span");s.className="badge score-badge",s.textContent=`🧠 RepoMind: ${e.contributionScore}/100`,a.appendChild(s)}r.appendChild(o),r.appendChild(a),t.appendChild(n)}catch{}}let d=null;function l(){const e=f();if(!e){y(),d=null;return}const t=`${e.owner}/${e.repo}`;if(t===d)return;d=t;const n=x(e);b(n),chrome.runtime.sendMessage({type:"DETECT_REPO",payload:n})}chrome.runtime.onMessage.addListener(e=>{e.type==="INJECT_BADGES"&&e.payload&&w(e.payload)});l();const k=new MutationObserver(()=>{l()});k.observe(document.querySelector("head > title")??document.head,{childList:!0,subtree:!0,characterData:!0});window.addEventListener("popstate",()=>{setTimeout(l,100)});
})()
