import $ from "jquery";
import katex from "katex";

const beginsWithTex = /^\\\\\(/;
const endsWithTex = /\\\)$/;

function testTex(text: string): boolean {
  return beginsWithTex.test(text) && endsWithTex.test(text);
}

export function highlightTex() {
  $(`
    .md code,
    .md code.language-tex
  `).each(function() {
    const el = $(this);
    const text = el.text()
      .trim()
      .replace(/[&]amp[;]/g, '&')
      .replace(/[/][/][/][/]/g, '//');
    if (
      !el.hasClass("language-tex")
      && !testTex(text)
    ) {
      return;
    }

    if (text.length > 0) {
      try {
        const output = katex.renderToString(text, {
          displayMode: el.hasClass("language-tex"),
          output: 'mathml',
        });
        $(output).insertAfter(this);
        $(this).remove();
        // $(pre).find('span.mspace.newline').remove();
      } catch (e) {
        console.warn('unable to render', text, e);
      }
    }
  });
}
