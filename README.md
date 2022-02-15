# Parsel

HTTP API mediation interface for automatic request/response condensation. Enhances throughput performance in high-scale environments.

`t 0.0`&ensp;|&ensp;`request 1` → `API`&ensp;|&ensp;`t 0.1`  
`t 1.0`&ensp;|&ensp;`request 2` → `API`&ensp;|&ensp;`t 1.1`  
`t 2.0`&ensp;|&ensp;`request 3` → `API`&ensp;|&ensp;`t 2.1`  
  
`t 0.0`&ensp;|&ensp;`request 1` ┓  
`t 1.0`&ensp;|&ensp;`request 2`&ensp;↦ `API`&ensp;|&ensp;`t 2.1`  
`t 2.0`&ensp;|&ensp;`request 3` ┛

## Introduction

Most HTTP API designs – REST in particular – segregate atomic resource access with HTTP parameters for stateless operation. Initializing a consuming client interface, multiple API requests are usually submitted concurrently or within an infinitesimal time interval.  
  
Parsel provides a communication mediator between (API) server and client: Based on different strategies, multiple contextually related requests are being condensed into a single request. However, that behavior is abstract to the user; Parsel is exporting a Promise interface similar to the `axios` library.

### Example

``` js
// Parsel API connection interface
const api = new PARSEL({
    origin: "https://example.com",
    interval: 250
});

// interval(): Condense requests made within configured interval:
api.interval("/resource/0", {
    method: "get"  // Fetch augmented
})
.then(res => res.text())
.then(res => console.log(res));

api.interval("/resource/1", {
    method: "get"  // Fetch augmented
})
.then(res => res.json())
.then(res => console.log(res));

// schedule(): Condense requests made until manual completion:
const scheduledReq1 = api.schedule("/resource/2", {
    method: "get"
});

const scheduledReq2 = api.schedule("/resource", 
    method: "post",
    body: {
        name: "Harry"
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

Every independent API communication can be organized from a specific Parsel scope object. Creating a scope, you have to provide it with the API origin infirmation and additional configurations.  
  
In the below stated example we create a Parsel scope object. It is given a cnfiguration object stating the related API *origin* (also referred to as *base URL*) which all the requests will be associated with and the interval (condensation window) size upon which respective requests will be condensed.

``` js
const api = new PARSEL({
    origin: "https://example.com",
    interval: 250
});
```

#### Properties

| Name       | Type     | Description |
| :--------- | :------- | :---------- |
| `origin`   | *String* | API origin |
| `interval` | *Number* | Condensation interval size in ms |

### Requests

Constructing a UI, usually several API requests are (concurrently) made upon the initialization process in order to obtain individual user data for display. As the UI's loading completes with the last piece of data to be received and rendered accordingly, these requests could be condensed thogether.

> Condensed requests are not suited for requests significantly differing in payload size. Use traditional, acutally concurrent requests in that case.

#### Temporaly `interval()`

#### Scheduled `schedule.add()`, `schedule.complete()`

#### Immediately `immediate()`

## Server Interface

### Mediation

Parsel is mediating an API representing an intermediate node in the communication between client and server. There are two ways of integrating Parsel into an API server:

- Giving Parsel a dedicated API route
- Having Parsel act as a proxy

#### Dedicated route

For a seamless integration into an existing API – benefiting from globally effective API middleware layers – it is most effective to have Parsel mediate from a specific route in your API architecture.

##### Prerequisites

- Body parsing

#### Proxy

### Events

