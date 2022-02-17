# Parsel

HTTP API mediation interface for automatic request/response condensation. Enhances throughput performance in high-scale environments.

<sup>...conventionally:</sup>  
`request 1` ⇄ `API`  
`request 2` ⇄ `API`  
`request 3` ⇄ `API`  
  
<sup>...with **Parsel**:</sup>  
`request 1` ┓  
`request 2`&ensp;| ⇄ `API`  
`request 3` ┛

## Introduction

Most HTTP API designs – REST in particular – segregate atomic resource access with HTTP parameters for stateless operation. Initializing a consuming client interface, multiple API requests are usually submitted concurrently or within an infinitesimal time window in order to retrieve individual data. Instead of sending multiple requests with complete API endpoint roundtimes each they could be condensed into a single, outcome equivalent request.
  
Parsel provides a communication mediator between (API) server and client: Based on different strategies, multiple contextually related requests are being condensed into a single request. However, that behavior is abstract to the user; Parsel is exporting a Promise interface similar to the *axios* library.

### Example

``` js
// Parsel API connection interface
const api = new PARSEL("https://example.com", {
    interval: 250
});

// interval(): Condense requests made within configured interval:
api.interval("/schools/0")
.then(res => res.text())
.then(res => console.log(res));

const intervalReq2 = api.interval("/schools/1", {
    method: "GET"
});

// schedule(): Condense requests made until manual completion:
const scheduleReq1 = api.schedule("/pupils/2");

const scheduleReq2 = api.schedule("/pupils", 
    method: "POST",
    body: {
        name: "Harry Potter",
        gender: gender.MALE
    }
});

api.complete();
```

## Installation

### Node

``` cli
npm install parsel
```

#### Client

``` js
const PARSEL = require("parsel").client;
```

#### Server

``` js
const parsel = require("parsel").server;
```

### Browser client

``` js
<script src="https://unpkg.com/parsel/dist/parsel.min.js"></script>
```

## Client Interface

### Scopes

Every independent API communication can be organized from a specific Parsel scope object. Creating a scope, it has to be provided it with the API origin and optional configuration data.  
  
In the below stated example we create a Parsel scope object. It is given a cnfiguration object stating the related API *origin* (also referred to as *base URL*) which all the requests will be associated with and the interval (condensation window) size upon which respective requests will be condensed.

#### Syntax

``` js
const api = new PARSEL(origin, options = {});
```

##### Parameter

| Name      | Type     | Description |
| :-------- | :------- | ----------- |
| `origin`  | *String* | Origin URL |
| `options` | *Object* | Optional configurations  |

##### Options properties

| Name       | Type     | Description                      | Default |
| :--------- | :------- | :------------------------------- | :------ |
| `interval` | *Number* | Condensation interval size in ms | 250     |

### Requests

Parsel provides a Promise based request interface accessible from the folowing pattern:

#### Generic Syntax

``` js
api.<request-type>(options = {});
```

##### Parameter

| Name      | Type     | Description |
| :-------- | :------- | ----------- |
| `options` | *Object* | Optional configurations |

##### Options properties

| Name      | Type     | Description                                         | Default |
| :-------- | :------- | :-------------------------------------------------- | :------ |
| `method`  | *String* | Request method                                      | GET     |
| `headers` | *Object* | Request headers (dictionary)                        | {}      |
|           |          | *Additional options (see browser native `fetch()`)* |         |

### Interval requests

> ↳ `interval`

When a user interface is assembled for an individual client, the API requests retrieving respective data usually happen within a small time span. Interval requests made are being codensed alongside those made in the same time window. The window size is to be defined in the scope configuration object provided upon creation.  
  
The request interval opens once an interval request is made, hence any subsequent request within the time window is condensed along that activating request. When the time window has run out, the condensed request is submit and processed right before the interval closes. As soon as another interval request fires, the interval is (re-)opens.

> Although absolute time usually does not represent a consistently reliable value among different devices, it serves the case of building a user interface on the client side.

``` js
const api = new PARSEL("localhost", {
    interval: 150   // // Interval size 150ms
});

// 0ms in
// [ (1st) Request interval opened ]
const req1 = api.interval("/teachers/0", {
    method: "GET",
    headers: {
        "Authorization": "Bearer 2o38uto1hxgtvyil": 
    }
});

// [ ... ]

// 100ms in
// [ Part of the active request interval ]
const req2 = api.interval("/teachers/1");

// 150ms in
// [ Request interval closed ]
// [ Condensed request submission in background => all request promises resolve ]

// 200ms in
// [ (2nd) Request interval opened ]
const req3 = api.interval("/teachers/2");
```

### Schedule requests

> ↳ `schedule.add` `schedule.complete`

Instead of relying on temporaly condensation, the moment of condensated submission can also be set manually. Using `schedule.add()`, requests can be added to the schedule. Once `schedule.complete()` is called, any previously scheduled request is written to the condensed request and submit.

``` js
const req1 = api.schedule.add("/wands/0");

// [ ... ]

const req2 = api.schedule.add("/wands/1");

// [ ... ]

const req3 = api.schedule.add("/wands", {
    method: "POST",
    body: {
        length: 37.5,
        core: "dragon heartstring"
    }
});

api.schedule.complete();
// [ Condensed request submission in background => all request promises resolve ]
```

### Immediate requests

> ↳ `immediate`

The immediate request interface exists for providing consistency in the API communication behavior. It provides a direct communication method with `immediate()` working very similar to the browser native `fetch()`.

``` js
api.immediate("/spells", {
    method: "POST",
    body {
        type: "charm",
        dictum: "Expecto Patronum"
    }
});
// [ Immediate, singular request submission => request promise resolves ]
```

### Get scope information

Information about a referenced scope including to its configuration and pending requests can be obtained calling `info()`:

``` js
api.info();
```

> The method returns an object.

## Server Interface

### Mediation

Parsel is mediating an API representing an intermediate node in the communication between client and server. Since it is a fundamental design principle of Parsel to not change the way APIs are built and accessed, the mediation concept is realized with a HTTP proxy instance.  
  
Setting up Parsel mediation requires a single statement:

``` js
parsel.mediate();
```

> The API logic must not be changed at all, nor do related modules need to state the mediation call.

### Message events

During operation Parsel emits `message` events that can be listened for (e.g. for feeding a logging mechanism).

``` js
parsel.on("message", msg => {
    console.log(msg);
});
```

> The callback is passed an object.