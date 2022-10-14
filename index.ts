import $ from "jquery";
import "jquery-ui/dist/jquery-ui";
import "jquery-ui/dist/themes/base/jquery-ui.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/default.css";

hljs.highlightAll();

$(function start() {
  $(".md").each(function(){
    $(this).html(marked($(this).html()));
  });
});
