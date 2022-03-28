/* eslint-disable prefer-destructuring */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

function loadView(viewName) {
  fetch(`./views/${viewName}/data.json`).then((r) => r.json()).then((json) => {
    // Default settings
    let props = {
      compass: false,
      autoLoad: true,
      showZoomCtrl: false,
      keyboardZoom: false,
      autoRotate: -2,
      autoRotateInactivityDelay: 30000,
      default: {
        firstScene: json.firstScene,
        author: 'Archipelago',
        sceneFadeDuration: 1000,
      },
      scenes: {},
    };
    // Partial panorama settings (non-full 360°)
    if (json.type === 'partial') {
      props = {
        ...props,
        type: 'equirectangular',
        minPitch: -32,
        maxPitch: 32,
        avoidShowingBackground: true,
      };
    }
    // Loading scenes
    Object.keys(json.scenes).forEach((scene) => {
      const objScene = json.scenes[scene];

      props.scenes[scene] = {
        type: props.type,
        title: objScene.text,
        pitch: objScene.dir[0],
        yaw: objScene.dir[1],
        panorama: `./views/archipelago-bali/${scene}.jpg`,
        hotSpots: [],
      };

      // Loading Hotspots: Scenes
      Object.keys(objScene.scenes).forEach((spot) => {
        const objSpot = objScene.scenes[spot];
        props.scenes[scene].hotSpots.push({
          type: 'scene',
          text: json.scenes[spot].text,
          sceneId: spot,
          pitch: objSpot[0],
          yaw: objSpot[1],
        });
      });
      // Loading Hotspots: Infos
      Object.keys(objScene.infos).forEach((spot) => {
        const objSpot = objScene.infos[spot];
        props.scenes[scene].hotSpots.push({
          type: 'info',
          text: objSpot.text,
          pitch: objSpot.pos[0],
          yaw: objSpot.pos[1],
        });
      });
    });

    const viewer = pannellum.viewer('panorama', props);

    /*
    viewer.on('mousedown', (event) => {
      const coords = viewer.mouseEventToCoords(event);
      console.log(coords);
    });
    */
  });
}
