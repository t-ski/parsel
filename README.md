# Parsel

HTTP API mediation interface for automatic request/response condensation. Enhances throughput performance in high-scale environments.

`t 0.0`&ensp;|&ensp;`request 1` → `API`&ensp;|&ensp;`t 0.1`
`t 1.0`&ensp;|&ensp;`request 2` → `API`&ensp;|&ensp;`t 1.1`
`t 2.0`&ensp;|&ensp;`request 3` → `API`&ensp;|&ensp;`t 2.1`

`t 0.0`&ensp;|&ensp;`request 1` ┓
`t 1.0`&ensp;|&ensp;`request 2`&ensp;↦ `API`&ensp;|&ensp;`t 2.1`
`t 2.0`&ensp;|&ensp;`request 3` ┛

## Introduction

Most HTTP API designs – REST in particular – segregate atomic resources access utilizing HTTP parameters (such as method and query) for stateless operation. Initializing a consuming client interface, multiple API requests are usually submitted concurrently or within an infinitesimal time interval.  
  
Parsel provides a communication mediator between (API) server and client; Multiple requests within a suited temporal context are strategically being condensed, without changing the general programmatic concept.

## Example

``` js
const api = new PARSEL({
    origin: "https://example.con",
    interval: 250
});

// Requests made within 250ms condensed submit bundled:
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

// Requests suspended submit upon manual completion:
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

### Node (server layer and client)

``` cli
npm install parsel
```

#### Browser client

``` js
<script src="https://unpkg.com/parsel/dist/parsel.min.js"></script>
```