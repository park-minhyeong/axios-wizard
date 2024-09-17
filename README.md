# AXIOS Wizard
While working on client-server integration and external API integration, I started to feel the limitations of fetch. Axios offered a variety of config options, making it convenient, but setting it up for each project became tedious. To solve this issue, I created axios-wizard and published it on npm.

After finishing it, this thought came to mind:

`axios is under-controlled`

## HOW TO USE
First, create an object that defines the origin of the API server. The key is the server’s name, and the value is its address. 

After that, call the handler function to declare the API controller.

```typescript
import { handler } from "axios-wizard";

const apiConfig: Record<string, string>={
	some: 'https://api.some.com'
	some2: import.meta.env.SOME2_API_ORIGIN
	...
}

const httpRequest = handler(apiConfig)
```

It is possible to write the API call function as follows.
```typescript
// api.ts
const apiUndefined = httpRequest.some() // end-point is https://api.some.com
const apiV1 = httpRequest.some("v1") // end-point is https://api.some.com/v1

async function getTest(){
	const response = await apiV1.get("/test") // end-point is https://api.some.com/v1/test, and can generic
	return response.data; // return type is AxiosConfig
}

interface Test{
	a: string
}

async function getTestWithGeneric(){
	const response = await apiV1.get<Test>("/test") // can empower generic type
	return response.data; // return type is AxiosConfig
}

```