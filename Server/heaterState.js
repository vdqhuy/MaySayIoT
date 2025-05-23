// heaterState.js

let heaterStatus = false;

function setHeaterStatus(value) {
  heaterStatus = value;
  console.log("🔧 [heaterState] heaterStatus updated to:", value);
}

function getHeaterStatus() {
  return heaterStatus;
}

module.exports = {
  setHeaterStatus,
  getHeaterStatus,
};
