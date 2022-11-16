import $ from "jquery";
import "jquery-ui/dist/jquery-ui";
import "jquery-ui/dist/themes/base/jquery-ui.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "jquery.flot";
import * as d3 from "d3";
import { marked } from "marked";
import hljs from "highlight.js";
import "katex/dist/katex.css";
import "../style.css";
import { PuckWorld } from "./puck-world";

import * as puckagent from "../agentzoo/puckagent.json";
import { DQNAgent } from "@brainjs/rl";

import {highlightTex} from "../highlight-tex";

type D3Line = d3.Selection<SVGLineElement, unknown, HTMLElement, null>;
type D3Circle = d3.Selection<SVGCircleElement, unknown, HTMLElement, null>;

hljs.highlightAll();
const W = 600, H = 600;
let d3line: D3Line | null = null;
let d3agent: D3Circle | null = null;
let d3target: D3Circle | null = null;
let d3target2: D3Circle | null = null;
let d3target2_radius: D3Circle | null = null;
function initDraw() {
  const d3elt = d3.select('#draw');
  d3elt.html('');

  const w = 600;
  const h = 600;
  const svg = d3elt
    .append('svg')
    .attr('width', w)
    .attr('height', h)
    .append('g')
    .attr('transform', 'scale(1)');

  // define a marker for drawing arrowheads
  svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("refX", 3)
    .attr("refY", 2)
    .attr("markerWidth", 3)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0,0 V 4 L3,2 Z");

  // draw the puck
  d3agent = svg.append('circle')
    .attr('cx', 100)
    .attr('cy', 100)
    .attr('r', puck_world.rad * W)
    .attr('fill', '#FF0')
    .attr('stroke', '#000')
    .attr('id', 'puck');

  // draw the target
  d3target = svg.append('circle')
    .attr('cx', 200)
    .attr('cy', 200)
    .attr('r', 10)
    .attr('fill', '#0F0')
    .attr('stroke', '#000')
    .attr('id', 'target');

  // bad target
  d3target2 = svg.append('circle')
    .attr('cx', 300)
    .attr('cy', 300)
    .attr('r', 10)
    .attr('fill', '#F00')
    .attr('stroke', '#000')
    .attr('id', 'target2');

  d3target2_radius = svg.append('circle')
    .attr('cx', 300)
    .attr('cy', 300)
    .attr('r', 10)
    .attr('fill', 'rgba(255,0,0,0.1)')
    .attr('stroke', '#000');

  // draw line indicating forces
  d3line = svg.append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', 0)
    .attr('stroke', 'black')
    .attr('stroke-width', '2')
    .attr("marker-end", "url(#arrowhead)");
}

function updateDraw(a: number, s: number[], r: number): void {
  if (!d3agent) throw 'error';
  if (!d3target) throw 'error';
  if (!d3target2) throw 'error';
  if (!d3target2_radius) throw 'error';
  if (!d3line) throw 'error';
  // reflect puck world state on screen
  const ppx = puck_world.ppx; const ppy = puck_world.ppy;
  const tx = puck_world.tx; const ty = puck_world.ty;
  const tx2 = puck_world.tx2; const ty2 = puck_world.ty2;

  d3agent.attr('cx', ppx * W).attr('cy', ppy * H);
  d3target.attr('cx', tx * W).attr('cy', ty * H);
  d3target2.attr('cx', tx2 * W).attr('cy', ty2 * H);
  d3target2_radius.attr('cx', tx2 * W).attr('cy', ty2 * H).attr('r', puck_world.BADRAD * H);
  d3line.attr('x1', ppx*W).attr('y1', ppy*H).attr('x2', ppx*W).attr('y2', ppy*H);
  const af = 20;
  d3line.attr('visibility', a === 4 ? 'hidden' : 'visible');
  if (a === 0) {
    d3line.attr('x2', ppx*W - af);
  }
  if (a === 1) {
    d3line.attr('x2', ppx*W + af);
  }
  if (a === 2) {
    d3line.attr('y2', ppy*H - af);
  }
  if (a === 3) {
    d3line.attr('y2', ppy*H + af);
  }

  // color agent by reward
  const vv = r + 0.5;
  const ms = 255.0;
  let g = 0;
  let b = 0;

  if (vv > 0) { g = 255; r = 255 - vv*ms; b = 255 - vv*ms; }
  if (vv < 0) { g = 255 + vv*ms; r = 255; b = 255 + vv*ms; }
  const vcol = 'rgb('+Math.floor(r)+','+Math.floor(g)+','+Math.floor(b)+')';
  d3agent.attr('fill', vcol);
}

function gofast() { steps_per_tick = 100; }
function gonormal() { steps_per_tick = 10; }
function goslow() { steps_per_tick = 1; }

// flot stuff
const nflot = 1000;
function initFlot() {
  const container = $("#flotreward");
  const res = getFlotRewards();
  const series = [{
    data: res,
    lines: { fill: true }
  }];
  const plot = $.plot(container, series, {
    grid: {
      borderWidth: 1,
      minBorderMargin: 20,
      labelMargin: 10,
      backgroundColor: {
        colors: ["#FFF", "#e4f4f4"]
      },
      margin: {
        top: 10,
        bottom: 10,
        left: 10,
      }
    },
    xaxis: {
      min: 0,
      max: nflot
    },
    yaxis: {
      min: -2,
      max: 1
    }
  });
  setInterval(function(){
    series[0].data = getFlotRewards();
    plot.setData(series);
    plot.draw();
  }, 100);
}
function getFlotRewards() {
  // zip rewards into flot data
  const res = [];
  for(let i = 0, n = smooth_reward_history.length; i < n; i++) {
    res.push([i, smooth_reward_history[i]]);
  }
  return res;
}

let steps_per_tick: number = 1;
let sid: number | NodeJS.Timer = -1;
let action: number = 0;
let state: number[] = [];
let smooth_reward_history: number[] = [];
let smooth_reward: null | number = null;
let flott = 0;
function togglelearn() {
  if (sid === -1) {
    sid = setInterval(function() {
      let obs: { r: number, } = { r: 0};
      for (let k = 0; k < steps_per_tick; k++) {
        state = puck_world.getState();
        action = agent.act(state);
        obs = puck_world.sampleNextState(action);
        agent.learn(obs.r);
        if (smooth_reward == null) { smooth_reward = obs.r; }
        smooth_reward = smooth_reward * 0.999 + obs.r * 0.001;
        flott += 1;
        if (flott === 200) {
          // record smooth reward
          if(smooth_reward_history.length >= nflot) {
            smooth_reward_history = smooth_reward_history.slice(1);
          }
          smooth_reward_history.push(smooth_reward);
          flott = 0;
        }
      }

      updateDraw(action, state, obs.r);
      if (typeof agent.expi !== 'undefined') {
        $("#expi").html(agent.expi.toString());
      }
      if (typeof agent.tderror !== 'undefined') {
        $("#tde").html(agent.tderror.toFixed(3));
      }
      //$("#tdest").html('tderror: ' + agent.tderror_estimator.getMean().toFixed(4) + ' +/- ' + agent.tderror_estimator.getStd().toFixed(4));

    }, 20);
  } else {
    clearInterval(sid);
    sid = -1;
  }
}

function saveAgent() {
  $("#mysterybox").fadeIn();
  $("#mysterybox").val(JSON.stringify(agent.toJSON()));
}

function loadAgent() {
  agent = new DQNAgent(puckagent);
  // set epsilon to be much lower for more optimal behavior
  agent.epsilon = 0.05;
  $("#slider").slider('value', agent.epsilon);
  $("#eps").html(agent.epsilon.toFixed(2));
  // kill learning rate to not learn
  agent.alpha = 0;
}

function safeJson(selector: string) {
  const json = $(selector).val();
  return JSON.parse((json || '').toString());
}

function resetAgent(): void {
  const spec = safeJson("#agentspec");
  agent = new DQNAgent({
    ...spec,
    inputSize: 4,
    outputSize: 8,
  });
}

let w; // global world object
let current_interval_id;
let skipdraw = false;
let puck_world: PuckWorld = new PuckWorld();
let agent: DQNAgent = new DQNAgent({});
function start() {
  puck_world = new PuckWorld();

  initDraw();

  const spec = safeJson("#agentspec");

  //agent = new RL.ActorCritic(env, spec);
  agent = new DQNAgent(spec);
  //agent = new RL.RecurrentReinforceAgent(env, {});
  initFlot();

  // slider sets agent epsilon
  $("#slider").slider({
    min: 0,
    max: 1,
    value: agent.epsilon,
    step: 0.01,
    slide: function(event, ui) {
      agent.epsilon = ui.value || 0;
      $("#eps").html((ui.value || 0).toFixed(2));
    }
  });
  $("#eps").html(agent.epsilon.toFixed(2));

  togglelearn(); // start

  // render markdown
  $(".md").each(function(){
    $(this).html(marked($(this).html()));
  });
}

$(() => {
  $('#reset-agent').on('click', resetAgent);
  $('#togglelearn').on('click', togglelearn);
  $('#gofast').on('click', gofast);
  $('#gonormal').on('click', gonormal);
  $('#goslow').on('click', goslow);
  $('#load-agent').on('click', loadAgent);
  start();
  highlightTex();
});
