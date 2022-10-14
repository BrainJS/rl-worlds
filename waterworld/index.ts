import { WaterWorld } from "./water-world";
import { WorldAgent } from "./agents/world-agent";
import { HumanAgent } from "./agents/human-agent";
import $ from "jquery";
import "jquery-ui/dist/jquery-ui";
import "jquery-ui/dist/themes/base/jquery-ui.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "jquery.flot";
import hljs from "highlight.js";
import { marked } from "marked";

import * as wateragent from "../agentzoo/wateragent.json";

const eyes = 30;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let agentView: boolean = false;
let humanControls: boolean = false;

hljs.highlightAll();

// Draw everything
function draw() {
  if (!canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 1;
  const { agents } = w;

  // draw walls in environment
  ctx.strokeStyle = 'rgb(0,0,0)';
  ctx.beginPath();
  for(let i = 0, n = w.walls.length; i < n; i++) {
    const q = w.walls[i];
    ctx.moveTo(q.p1.x, q.p1.y);
    ctx.lineTo(q.p2.x, q.p2.y);
  }
  ctx.stroke();

  // draw agents
  // color agent based on reward it is experiencing at the moment
  let r = 0;
  ctx.fillStyle = `rgb(${ r }, 150, 150)`;
  ctx.strokeStyle = 'rgb(0,0,0)';
  for (let i = 0, n = agents.length; i < n; i++) {
    const a = agents[i];

    // draw agents body
    ctx.beginPath();
    ctx.arc(a.op.x, a.op.y, a.rad, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.stroke();

    // draw agents sight
    for (let ei = 0, ne = a.eyes.length; ei < ne; ei++) {
      const e = a.eyes[ei];
      const sr = e.sensed_proximity;
      if (e.sensed_type === -1 || e.sensed_type === 0) {
        ctx.strokeStyle = 'rgb(200,200,200)'; // wall or nothing
      }
      if (e.sensed_type === 1) { ctx.strokeStyle = 'rgb(255,150,150)'; } // apples
      if (e.sensed_type === 2) { ctx.strokeStyle = 'rgb(150,255,150)'; } // poison
      ctx.beginPath();
      ctx.moveTo(a.op.x, a.op.y);
      ctx.lineTo(
        a.op.x + sr * Math.sin(a.oangle + e.angle),
        a.op.y + sr * Math.cos(a.oangle + e.angle)
      );
      ctx.stroke();
    }
  }

  // draw items
  ctx.strokeStyle = 'rgb(0,0,0)';
  if(!agentView) {
    for (let i = 0, n = w.items.length; i < n; i++) {
      const it = w.items[i];
      if (it.type === 1) {
        ctx.fillStyle = 'rgb(255, 150, 150)';
      }
      if (it.type === 2) {
        ctx.fillStyle = 'rgb(150, 255, 150)';
      }
      ctx.beginPath();
      ctx.arc(it.p.x, it.p.y, it.rad, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.stroke();
    }
  }
}

// Tick the world
const smooth_reward_history: number[][] = []; // [][];
const smooth_reward: number[] = [];
let flott: number = 0;
function tick() {
  if (simspeed === 3) {
    for (let k = 0; k < 50; k++) {
      w.tick();
    }
  } else {
    w.tick();
  }
  draw();
  updateStats();

  flott += 1;
  for (let i = 0; i < w.agents.length; i++) {
    const rew = w.agents[i].last_reward;
    if (!smooth_reward[i]) { smooth_reward[i] = 0; }
    smooth_reward[i] = smooth_reward[i] * 0.999 + rew * 0.001;
    if (flott === 50) {
      // record smooth reward
      if (smooth_reward_history[i].length >= nflot) {
        smooth_reward_history[i] = smooth_reward_history[i].slice(1);
      }
      smooth_reward_history[i].push(smooth_reward[i]);
    }
  }
  if (flott === 50) {
    flott = 0;
  }

  const agent = w.agents[0];
  $('#expi').html(agent.expi.toString());
  $('#tde').html(agent.tderror.toFixed(3));
}

// flot stuff
let nflot: number = 1000;
function initFlot() {
  const container = $('#flotreward');
  const res = getFlotRewards(0);
  const res1 = getFlotRewards(1);
  const series = [{
    data: res,
    lines: {fill: true}
  }, {
    data: res1,
    lines: {fill: true}
  }];
  const plot = $.plot(container, series, {
    grid: {
      borderWidth: 1,
      minBorderMargin: 20,
      labelMargin: 10,
      backgroundColor: {
        colors: ['#FFF', '#e4f4f4']
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
      min: -0.1,
      max: 0.1
    }
  });
  setInterval(function(){
    for (let i = 0; i < w.agents.length; i++) {
      series[i].data = getFlotRewards(i);
    }
    plot.setData(series);
    plot.draw();
  }, 100);
}

function getFlotRewards(agentId: number): Array<[number, number]> {
  // zip rewards into flot data
  const res: Array<[number, number]> = [];
  if (agentId >= w.agents.length || !smooth_reward_history[agentId]) {
    return res;
  }
  for (let i = 0, n = smooth_reward_history[agentId].length; i < n; i++) {
    res.push([i, smooth_reward_history[agentId][i]]);
  }
  return res;
}

let simspeed = 2;

function goVeryFast() {
  window.clearInterval(currentIntervalId);
  currentIntervalId = setInterval(tick, 0);
  skipDraw = true;
  simspeed = 3;
}

function goFast() {
  window.clearInterval(currentIntervalId);
  currentIntervalId = setInterval(tick, 0);
  skipDraw = true;
  simspeed = 2;
}

function goNormal() {
  window.clearInterval(currentIntervalId);
  currentIntervalId = setInterval(tick, 30);
  skipDraw = false;
  simspeed = 1;
}

function goSlow() {
  window.clearInterval(currentIntervalId);
  currentIntervalId = setInterval(tick, 200);
  skipDraw = false;
  simspeed = 0;
}

$(() => {
  $('#go-very-fast').on('click', goVeryFast);
  $('#go-fast').on('click', goFast);
  $('#go-normal').on('click', goNormal);
  $('#go-slow').on('click', goSlow);
  $('#toggle-agent-view').on('click', toggleAgentView);
  $('#enable-human').on('click', enableHuman);
  $('#reset-agent').on('click', resetAgent);
  $('#load-agent').on('click', loadAgent);
  $('body').on('keydown', (e) => {
    lastKey = e.keyCode || e.which;
    if (lastKey == 37 || lastKey == 38 || lastKey == 39 || lastKey == 40) {
      enableHuman();
      e.preventDefault();
      if (lastKey == 37) {
        humanAction = 0;
      }
      if (lastKey == 39) {
        humanAction = 1;
      }
      if (lastKey == 38) {
        humanAction = 2;
      }
      if (lastKey == 40) {
        humanAction = 3;
      }
    }
  });
});

function saveAgent() {
  const agent = w.agents[0];
  $('#mysterybox')
    .fadeIn()
    .val(JSON.stringify(agent.toJSON()));
}

function safeJson(selector: string) {
  const json = $(selector).val();
  return JSON.parse((json || '').toString());
}


function toggleAgentView() {
  agentView = !agentView;
}

let lastKey = null;
let humanAction = -1;
function enableHuman() {
  if (!humanControls) {
    humanControls = true;
    let a = new HumanAgent({ eyes });
    a.humanAction = humanAction;
    w.agents.push(a);
    smooth_reward_history.push([]);
  }
}
function resetAgent() {
  const spec = safeJson('#agentspec');
  w = new WaterWorld(canvas);
  w.addAgent(new WorldAgent({
    ...spec,
    eyes
  }));
}

function loadAgent() {
  const agent = w.agents[0];
  agent.fromJSON(wateragent); // corss your fingers...
  // set epsilon to be much lower for more optimal behavior
  agent.epsilon = 0.05;
  $('#slider').slider('value', agent.epsilon);
  $('#eps').html(agent.epsilon.toFixed(2));
  // kill learning rate to not learn
  agent.alpha = 0;
}

let w: WaterWorld; // global world object
let currentIntervalId: NodeJS.Timer;
let skipDraw: boolean = false;
$(function start() {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const context = canvas.getContext('2d');
  if (context === null) throw new Error(`Couldn't get context from Canvas`);
  ctx = context;
  const spec = safeJson('#agentspec');

  w = new WaterWorld(canvas);
  for(let k = 0; k < 1; k++) {
    w.addAgent(new WorldAgent({ ...spec, eyes, }));
    smooth_reward_history.push([]);
  }

  const slider = $('#slider');
  slider.slider({
    min: 0,
    max: 1,
    value: w.agents[0].epsilon,
    step: 0.01,
    slide: function(event, ui) {
      const v = ui.value || 0;
      w.agents[0].epsilon = v;
      $('#eps').html(v.toFixed(2));
    }
  });
  $('#eps').html(w.agents[0].epsilon.toFixed(2));
  slider.slider('value', w.agents[0].epsilon);

  initFlot();
  goNormal();

  // render markdown
  $('.md').each(function(){
    $(this).html(marked($(this).html()));
  });
});

function updateStats() {
  const stats = ['<ul>'];
  for(let i = 0; i < w.agents.length; i++) {
    const agent = w.agents[i];
    stats.push(`<li>Player ${ (i+1) }: ${ agent.apples } apples, ${ agent.poison } poison</li>`);
  }
  stats.push('</ul>');
  $('#apples_and_poison').html(stats.join(''));
}
