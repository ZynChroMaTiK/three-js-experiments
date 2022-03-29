/* eslint-disable
no-undef,no-unused-vars,prefer-destructuring,global-require,import/no-dynamic-require
*/
function loadView(viewName) {
  // Loads views of a folder based on data.json file inside it
  const viewFolder = `./views/${viewName}`;
  fetch(`${viewFolder}/data.json`).then((r) => r.json()).then((json) => {
    // Default settings
    let props = {
      autoLoad: true,
      compass: false,
      showControls: false,
      autoRotate: -2,
      autoRotateInactivityDelay: 30000,
      default: {
        firstScene: json.firstScene,
        sceneFadeDuration: 1000,
      },
      scenes: {},
    };

    // Special case for partial panorama settings (non-full 360°)
    if (json.type === 'partial') {
      props = {
        ...props,
        type: 'equirectangular',
        minPitch: -32,
        maxPitch: 32,
        avoidShowingBackground: true,
      };
    } else props.type = json.type;

    // Loading scenes
    Object.keys(json.scenes).forEach((scene) => {
      const objScene = json.scenes[scene];
      props.scenes[scene] = {
        type: props.type,
        title: objScene.text,
        pitch: objScene.dir[0],
        yaw: objScene.dir[1],
        panorama: `${viewFolder}/${scene}.jpg`,
        hotSpots: [],
      };

      // Loading Hotspots: Scenes
      if (typeof objScene.scenes !== 'undefined') {
        Object.keys(objScene.scenes).forEach((spot) => {
          const objSpot = objScene.scenes[spot];
          props.scenes[scene].hotSpots.push({
            type: 'scene',
            cssClass: 'spot sceneSpot',
            text: json.scenes[spot].text,
            sceneId: spot,
            pitch: objSpot[0],
            yaw: objSpot[1],
          });
        });
      }

      // Loading Hotspots: Infos
      if (typeof objScene.infos !== 'undefined') {
        Object.keys(objScene.infos).forEach((spot) => {
          const objSpot = objScene.infos[spot];
          props.scenes[scene].hotSpots.push({
            type: 'info',
            cssClass: 'spot infoSpot',
            text: objSpot.text,
            pitch: objSpot.pos[0],
            yaw: objSpot.pos[1],
          });
        });
      }

      // Loading Hotspots: Links
      if (typeof objScene.links !== 'undefined') {
        Object.keys(objScene.links).forEach((spot) => {
          const objSpot = objScene.links[spot];
          props.scenes[scene].hotSpots.push({
            type: 'info',
            cssClass: 'spot linkSpot',
            text: objSpot.text,
            pitch: objSpot.pos[0],
            yaw: objSpot.pos[1],
            URL: objSpot.url,
          });
        });
      }
    });

    const viewer = pannellum.viewer('panorama', props);

    viewer.on('mousedown', (event) => {
      const coords = viewer.mouseEventToCoords(event);
      console.log(coords);
    });
  });
}
