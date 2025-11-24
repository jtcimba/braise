//
//  Action.js
//  braise
//
//  Created by Jake Cimbalista on 11/5/25.
//

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

function isElementVisible(el) {
  if (!(el instanceof window.Element)) return false;

  const style = window.getComputedStyle(el);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    parseFloat(style.opacity) === 0 ||
    (style.filter && style.filter.includes('blur'))
  ) {
    return false;
  }

  const rect = el.getBoundingClientRect();
  if (
    rect.width === 0 ||
    rect.height === 0 ||
    rect.bottom < 0 ||
    rect.right < 0 ||
    rect.top > (window.innerHeight || document.documentElement.clientHeight) ||
    rect.left > (window.innerWidth || document.documentElement.clientWidth)
  ) {
    return false;
  }

  return true;
}

function getVisibleTextLength(root) {
  if (!root) return 0;
  let total = 0;

  function walk(node) {
    if (node.nodeType === 3) {
      const parent = node.parentElement;
      if (!parent) return;

      if (!isElementVisible(parent)) return;

      const text = node.textContent.trim();
      if (text.length > 0) total += text.length;
    } else if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (
        ['script', 'style', 'noscript', 'svg', 'head', 'meta', 'link'].includes(
          tag,
        )
      ) {
        return;
      }

      if (!isElementVisible(node)) return;

      node.childNodes.forEach(walk);
    }
  }

  walk(root);
  return total;
}

function getVisibleListItemsTexts(root) {
  if (!root) return [];
  const items = [];
  const listContainers = root.querySelectorAll('ul, ol');
  listContainers.forEach(function (list) {
    if (!isElementVisible(list)) return;
    // Check if list is inside main or article
    let parent = list.parentElement;
    let insideMainOrArticle = false;
    while (parent) {
      if (
        parent.tagName &&
        (parent.tagName.toLowerCase() === 'main' ||
          parent.tagName.toLowerCase() === 'article')
      ) {
        insideMainOrArticle = true;
        break;
      }
      parent = parent.parentElement;
    }
    if (!insideMainOrArticle) return;

    // Collect visible li elements text
    Array.from(list.children).forEach(function (li) {
      if (
        li.tagName &&
        li.tagName.toLowerCase() === 'li' &&
        isElementVisible(li)
      ) {
        const text = li.textContent.trim();
        if (text.length > 0) {
          items.push(text);
        }
      }
    });
  });
  return items;
}

var GetHTML = function () {
  var mainContent =
    document.querySelector('main') ||
    document.querySelector('article') ||
    document.body;

  if (!mainContent) {
    mainContent = document.body;
  }

  var clone = mainContent.cloneNode(true);

  clone.querySelectorAll('script, style, noscript, svg').forEach(function (el) {
    el.remove();
  });

  removeComments(clone);

  var jsonLd = extractJsonLd();

  var metaTags = document.head
    ? Array.from(document.head.querySelectorAll('meta'))
    : [];

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

  var html = clone.innerHTML;

  html = html.replace(/\n+/g, '\n');
  html = html.replace(/[ \t]+/g, ' ');

  var MAX_HTML_LENGTH = 50000;
  if (html.length > MAX_HTML_LENGTH) {
    html = html.substring(0, MAX_HTML_LENGTH);
  }

  var textLength = getVisibleTextLength(document.body);

  var visibleIngredients = getVisibleListItemsTexts(mainContent);
  var visibleInstructions = getVisibleListItemsTexts(mainContent);

  return {
    html: html,
    url: window.location.href,
    title: document.title,
    text_length: textLength,
    jsonLd: jsonLd,
    visibleIngredients: visibleIngredients,
    visibleInstructions: visibleInstructions,
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
