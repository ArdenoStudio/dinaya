(function () {
  var script = document.currentScript;
  var baseUrl = script && script.getAttribute("data-base");
  if (!baseUrl) {
    var src = script && script.src;
    if (src) baseUrl = src.replace(/\/embed\.js.*$/, "");
  }
  if (!baseUrl) baseUrl = "";

  function buildEmbedUrl(slug, config) {
    var url = new URL(baseUrl + "/embed/book/" + encodeURIComponent(slug));
    url.searchParams.set("embed", "1");
    if (window.location.origin) {
      url.searchParams.set("parentOrigin", window.location.origin);
    }
    if (config.service) url.searchParams.set("service", config.service);
    if (config.hideGallery) url.searchParams.set("hideGallery", "1");
    if (config.hideGallery === false) url.searchParams.set("hideGallery", "0");
    if (config.embedAccent) url.searchParams.set("embedAccent", config.embedAccent);
    return url.toString();
  }

  function embedTargetOrigin(iframe) {
    try {
      return new URL(iframe.src).origin;
    } catch (e) {
      return "";
    }
  }

  function sendEmbedPrefill(iframe, config) {
    if (!config || (!config.name && !config.email && !config.phone)) return;
    var targetOrigin = embedTargetOrigin(iframe);
    if (!targetOrigin || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: "dinaya:prefill",
        contact: {
          name: config.name || undefined,
          email: config.email || undefined,
          phone: config.phone || undefined,
        },
      },
      targetOrigin,
    );
  }

  function attachEmbedListener(iframe, config) {
    var allowedOrigin = embedTargetOrigin(iframe);
    if (!allowedOrigin) return;

    window.addEventListener("message", function (event) {
      if (event.origin !== allowedOrigin) return;
      if (event.source !== iframe.contentWindow) return;
      if (!event.data || typeof event.data.type !== "string") return;
      if (event.data.type === "dinaya:ready") {
        sendEmbedPrefill(iframe, config || {});
        return;
      }
      if (event.data.type === "dinaya:resize") {
        if (typeof event.data.height !== "number") return;
        iframe.style.height = Math.max(480, event.data.height) + "px";
        return;
      }
      if (event.data.type.indexOf("dinaya:") === 0) {
        document.dispatchEvent(
          new CustomEvent("dinaya-embed", { detail: event.data })
        );
      }
    });
  }

  function skeleton(el) {
    el.innerHTML =
      '<div style="min-height:520px;border-radius:16px;background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:200% 100%;animation:dinaya-shimmer 1.2s infinite"></div>' +
      '<style>@keyframes dinaya-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}</style>';
  }

  window.DinayaEmbed = {
    inline: function (opts) {
      var el =
        typeof opts.element === "string"
          ? document.querySelector(opts.element)
          : opts.element;
      if (!el) return;
      skeleton(el);
      var iframe = document.createElement("iframe");
      var config = opts.config || {};
      iframe.src = buildEmbedUrl(opts.slug, config);
      iframe.title = "Book appointment";
      iframe.style.cssText = "width:100%;height:" + (opts.height || 720) + "px;border:0;border-radius:16px";
      attachEmbedListener(iframe, config);
      iframe.onload = function () {
        el.innerHTML = "";
        el.appendChild(iframe);
      };
    },
    modal: function (opts) {
      var overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px";
      var panel = document.createElement("div");
      panel.style.cssText = "width:100%;max-width:920px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.2)";
      var iframe = document.createElement("iframe");
      var config = opts.config || {};
      iframe.src = buildEmbedUrl(opts.slug, config);
      iframe.title = "Book appointment";
      iframe.style.cssText = "width:100%;height:min(82vh,760px);border:0;display:block";
      attachEmbedListener(iframe, config);
      panel.appendChild(iframe);
      overlay.appendChild(panel);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) document.body.removeChild(overlay);
      });
      document.body.appendChild(overlay);
    },
  };
})();
