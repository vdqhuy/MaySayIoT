// fanState.js

let fanStatusManual = false;

function setFanStatusManual(value) {
  fanStatusManual = value;
  console.log("🔧 [fanState] fanStatusManual updated to:", value);
}

function getFanStatusManual() {
  return fanStatusManual;
}

module.exports = {
  setFanStatusManual,
  getFanStatusManual,
};
