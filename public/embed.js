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
    if (config.service) url.searchParams.set("service", config.service);
    if (config.name) url.searchParams.set("name", config.name);
    if (config.email) url.searchParams.set("email", config.email);
    if (config.phone) url.searchParams.set("phone", config.phone);
    if (config.hideGallery) url.searchParams.set("hideGallery", "1");
    return url.toString();
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
      iframe.src = buildEmbedUrl(opts.slug, opts.config || {});
      iframe.title = "Book appointment";
      iframe.style.cssText = "width:100%;height:" + (opts.height || 720) + "px;border:0;border-radius:16px";
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
      iframe.src = buildEmbedUrl(opts.slug, opts.config || {});
      iframe.title = "Book appointment";
      iframe.style.cssText = "width:100%;height:min(82vh,760px);border:0;display:block";
      panel.appendChild(iframe);
      overlay.appendChild(panel);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) document.body.removeChild(overlay);
      });
      document.body.appendChild(overlay);
    },
  };
})();
