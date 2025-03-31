TODO

- delete layers
- bezier drawing
- add measure sides
- toggle layer visibility
- make drawing mode -> edit sketch mode
  - sketches have paths on them
  - a sketch gets turned into an array of paths

DONE

- reorder layers
- add plugin search
- add plugins
- delete plugins
- remove plugin panel
- rename layers
- add grid
- add snap to grid
- reorder plugins

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
