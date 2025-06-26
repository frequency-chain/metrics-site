const providerUriList = ["https://1.rpc.frequency.xyz"];

let allow_metric_updates = true;

async function updateNumber(el, valueFn, updateMs) {
  if (allow_metric_updates) {
    try {
      const msaCount = await valueFn();
      const current = el.innerHTML;
      if (current !== msaCount) {
        el.classList.add("fadeOut");
        await new Promise((x) => setTimeout(x, 1100));
        el.innerHTML = msaCount;
        el.classList.remove("fadeOut");
      }
    } catch (e) {
      console.error(e);
    }
  }
  // Loop
  setTimeout(() => {
    updateNumber(el, valueFn, updateMs);
  }, updateMs);
}

async function getGraphCount() {
  const resp = await fetch("https://423ecab7-a00b-427f-a048-7c4fcae8b730.squids.live/graph-count/v/v1/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `query { totalGraphs }`,
    }),
  });
  const data = await resp.json();
  return data?.data?.totalGraphs?.toLocaleString() || "···";
}

async function getMsaCount() {
  const request = {
    jsonrpc: "2.0",
    method: "state_getStorage",
    // This is the key for msa.currentMsaIdentifierMaximum
    params: ["0x9f76716a68a582c703dd9e44700429b921c5be4bcc880b0f4de118246738f8c7"],
    id: 1,
  };
  const options = {
    method: "POST",
    // mode: "no-cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  };
  const response = await (await fetch(providerUriList[0], options)).json();
  return hexToBigEndian(response.result).toLocaleString();
}

function hexToBigEndian(input) {
  const work = input.replace("0x", "");
  const reversedString = [];
  for (let i = 0; i < work.length; i += 2) {
    reversedString.unshift(`${work[i]}${work[i + 1]}`);
  }
  return parseInt(reversedString.join(""), 16);
}

function startPresentation() {
  document.getElementById("fullscreen").requestFullscreen();
  document.getElementById("start").classList.add("inactive");
}

function autoHideFullscreenButton(idleMs) {
  let idleTimer = null;
  let idleState = false;
  const startButton = document.getElementById("start");
  document.addEventListener("mousemove", () => {
    clearTimeout(idleTimer);
    if (idleState == true && !document.fullscreen) {
      startButton.classList.remove("inactive");
    }
    idleState = false;
    idleTimer = setTimeout(function () {
      startButton.classList.add("inactive");
      idleState = true;
    }, idleMs);
  });
}

async function initTotUsers() {
  const defaultValue = 7995797;
  const el = document.getElementById("totusersCount");
  if (!el) return;

  async function refresh() {
    let display;
    try {
      const resp = await fetch("https://freesky-portal.liberti.social/stats/totusers");
      if (!resp.ok) throw "";
      const totusers = await resp.json();
      const n = Number(totusers) || defaultValue;
      display = n.toLocaleString();
    } catch {
      display = defaultValue.toLocaleString();
    }

    if (el.textContent !== display) {
      // ← BEGIN FADE SEQUENCE
      el.classList.add("fadeOut");
      await new Promise(r => setTimeout(r, 1100));
      el.textContent = display;
      el.classList.remove("fadeOut");
      // ← END FADE SEQUENCE
    }
  }

  await refresh();                   // first, right away
  setInterval(refresh, 6000);       // then every 6 s
}


function init() {
  initTotUsers();  

  updateNumber(document.getElementById("msaCount"), getMsaCount, 6000);
  updateNumber(document.getElementById("graphCount"), getGraphCount, 24000);

  autoHideFullscreenButton(2000);
  document.getElementById("start")
          .addEventListener("click", startPresentation);
  document.addEventListener("visibilitychange", () => {
    allow_metric_updates = !document.hidden;
  });
}

init();
