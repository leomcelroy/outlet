TODO

- rasterize
  - holes
- more plugins
  - translate
  - align
  - distribute
  - rotate
- bake layer
- flip y axis
- undo/redo
- drag plugin to other layer

- bezier drawing
- add measure sides
- toggle layer visibility
- make drawing mode -> edit sketch mode
  - sketches have paths on them
  - a sketch gets turned into an array of paths

DONE

- delete layers
- reorder layers
- add plugin search
- add plugins
- delete plugins
- remove plugin panel
- rename layers
- add grid
- add snap to grid
- reorder plugins
- make d not start a new path if in editting mode
- snap view window to content
- download file
- upload file

INFO

a path is

```js
{
  "id": "_bJWH",
  "type": "path",
  "data": [
      {
          "cmd": "start",
          "point": "_KXIN"
      },
      {
          "cmd": "line",
          "point": "_QCm5"
      },
      {
          "cmd": "line",
          "point": "_MCMz"
      },
      {
          "cmd": "line",
          "point": "_sT6B"
      },
      {
          "cmd": "line",
          "point": "_5a3f"
      },
      {
          "cmd": "line",
          "point": "_CUTD"
      },
      {
          "cmd": "line",
          "point": "_Q38u"
      },
      {
          "cmd": "line",
          "point": "_5AOB"
      },
      {
          "cmd": "close"
      }
  ],
  "layer": "DEFAULT_LAYER",
  "attributes": {
      "fill": "none",
      "stroke": "black",
      "strokeWidth": 2
  }
}
```

evaluated it is

```js
{
  "id": "_bJWH",
  "type": "path",
  "data": [
      {
        "cmd": "start",
         x: number,
         y: number
      },
      {
        "cmd": "line",
         x: number,
         y: number
      },
      {
        "cmd": "line",
         x: number,
         y: number
      },
      {
        "cmd": "line",
         x: number,
         y: number
      },
      {
        "cmd": "line",
         x: number,
         y: number
      },
      {
        "cmd": "line",
         x: number,
         y: number
      },
      {
        "cmd": "line",
         x: number,
         y: number
      },
      {
        "cmd": "line",
         x: number,
         y: number
      },
      {
        "cmd": "close"
      }
  ],
  "layer": "DEFAULT_LAYER",
  "attributes": {
      "fill": "none",
      "stroke": "black",
      "strokeWidth": 2
  }
}
```

### possible path

```js
{
  id: string,
  type: "path",
  data: [
    {
      cmd: "move",
      point: pointId
    },
    {
      cmd: "line",
      point: pointId
    },
    {
      cmd: "cubic",
      point: pointId
    },
    {
      cmd: "end", // goes to last move command
      point: pointId
    },
    {
      cmd: "move",
      point: pointId
    },
    {
      cmd: "line",
      point: pointId
    },
    {
      cmd: "cubic",
      point: pointId
    },
    {
      cmd: "end", // goes to last move command
      point: pointId
    },
  ],
  attributes: {
    fill: "black",
    etc...
  }
}

```

### sketches maybe

```
  sketches: [
    /*
    {
      id: "SKETCH_1",
      layer: "layerId",
      parameters: {
        parameterId: number,
      },
      points: {
        pointId: {
          x: parameterId,
          y: parameterId,
        },
      },
      paths: [
        {
          id,
          data: [
            {
              cmd: "start",
              point: pointId,
            },
            {
             cmd: "line",
             point: pointId,
            },
            {
              cmd: "cubic",
              point: pointId,
              control1: pointId,
              control2: pointId
            },
            {
              cmd: "end"
            }
          ]
        }
      ],
      attributes: {
        stroke: "black",
        fill: "none"
      },
    },
    */
  ],
```
