//
//  Action.js
//  braise
//
//  Created by Jake Cimbalista on 11/5/25.
//

function resolveUrl(url) {
  try {
    return new URL(url, window.location.href).href;
  } catch (e) {
    return url;
  }
}

function extractJsonLd() {
  var ldNodes = document.querySelectorAll('script[type="application/ld+json"]');
  return Array.from(ldNodes)
    .map(function (node) {
      return node.textContent || '';
    })
    .filter(function (content) {
      return content.trim().length > 0;
    });
}

function removeComments(node) {
  if (!window.NodeFilter) {
    return;
  }
  var iterator = document.createNodeIterator(
    node,
    window.NodeFilter.SHOW_COMMENT,
  );
  var comment;
  while ((comment = iterator.nextNode())) {
    comment.remove();
  }
}

var GetHTML = function () {
  var mainContent =
    document.querySelector('main') ||
    document.querySelector('article') ||
    document.body;
  var clone = mainContent.cloneNode(true);
  var jsonLd = extractJsonLd();
  var metaTags = document.head
    ? Array.from(document.head.querySelectorAll('meta'))
    : [];

  clone.querySelectorAll('script, style, noscript, svg').forEach(function (el) {
    el.remove();
  });

  removeComments(clone);

  if (metaTags.length > 0) {
    var metaWrapper = document.createElement('div');
    metaWrapper.setAttribute('data-braise-meta', 'true');
    metaTags.forEach(function (meta) {
      metaWrapper.appendChild(meta.cloneNode(true));
    });
    clone.insertBefore(metaWrapper, clone.firstChild);
  }

  if (jsonLd.length > 0) {
    var jsonLdWrapper = document.createElement('div');
    jsonLdWrapper.setAttribute('data-braise-json-ld', 'true');
    jsonLd.forEach(function (entry) {
      var script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.textContent = entry;
      jsonLdWrapper.appendChild(script);
    });
    clone.appendChild(jsonLdWrapper);
  }

  var paywallKeywords = [
    'subscribe',
    'membership required',
    'premium content',
    'sign in',
  ];
  var paywallElements = [];
  clone.querySelectorAll('div, span').forEach(function (el) {
    var text = el.innerText.toLowerCase();
    if (
      paywallKeywords.some(function (k) {
        return text.includes(k);
      })
    ) {
      paywallElements.push(el.outerHTML);
    }
  });

  var html = clone.innerHTML;

  if (paywallElements.length > 0) {
    html += '\n' + paywallElements.join('\n');
  }

  html = html.replace(/\n+/g, '\n');
  html = html.replace(/[ \t]+/g, ' ');

  var MAX_HTML_LENGTH = 50000;
  if (html.length > MAX_HTML_LENGTH) {
    html = html.substring(0, MAX_HTML_LENGTH);
  }

  return {
    html: html,
    url: window.location.href,
    title: document.title,
    jsonLd: jsonLd,
  };
};

var Action = function () {};

Action.prototype = {
  run: function (context) {
    context.completionFunction(GetHTML());
  },
  finalize: function () {},
};

window.ExtensionPreprocessingJS = new Action();
