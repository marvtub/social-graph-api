## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, start the dev server:
```bash
npm run dev
```

The frontend will now be running at [http://localhost:3000](http://localhost:3000).

## Challenge Requirements

To complete this challenge, you will need to create a server application that will interface with the provided frontend.

Your application must serve at `localhost:8080`.

You won't need to modify any of the frontend code, but you are welcome to look at it.


### Part 1:

You will implement a user registration and authentication system. A user has a name, email, password, and a list of friends.

Your application must implement the following endpoints. All endpoints accept and return JSON.

## `POST /v1/auth/register`
Used to register a new user account.

### Request:
```ts
type RequestBody = {
    name: string
    email: string
    password: string
}
```

### Response:
Any 200 response

## `POST /v1/auth/login`
Signs in to an existing account.

### Request:
```ts
type RequestBody = {
    email: string
    password: string
}
```

### Response:
Any 200 response

## `GET /v1/profile`
Retrieves the profile data for the authenticated user.

### Request:
None (use cookies for authentication)

### Response:
```ts
type ResponseBody = {
    email: string
    name: string
}
```

### Part 2:

You will implement a friends system, allowing users to add new friends, and view their network.

When a user adds another user as a friend, they immediately become friends, there is no friend request.

When viewing their friends, the user sees not only their own friends, but also their second and third degree friends as well (like LinkedIn).

Example:
```
Bob is friends with Sarah
Sarah is friends with Rachel
Rachel is friends with Sam
Sam is friends with Jack

On Bob's friend list, he sees:
Sarah (1st)
Rachel (2nd)
Sam (3rd)

Bob doesn't see Jack, as Jack is a 4th degree connection.
```

## `POST /v1/friends/add`
Adds another user as a friend.

### Request:
```ts
type RequestBody = {
    friendEmail: string
}
```

### Response:
Any 200 response

### `GET /v1/friends`
Returns the user's friend network.

### Request:
None

### Response:
```ts
type RequestBody = {
    name: string
    email: string
    degree: '1st' | '2nd' | '3rd'
}[]
```
