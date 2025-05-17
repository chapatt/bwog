<p align="center"><img src="images/logo.png" alt="bwog" style="width: 20em;" /></p>
<p align="center">bwog is a toy static site generator for a tumblelog/microblog</p>

## Architecture
The blog generated is by-and-large a static HTML site. The other component is a small nodejs app which facilitates adding posts and regenerating the site.

This structure can be seen in the included example nginx site configuration (any static server and reverse proxy can be used).

This block attempts to find a file at the webroot matching the path in the requested URL:
```
root /var/www/example;
index index.html;
	
location / {
	try_files $uri $uri/ =404;
}
```

This more-specific regex block is actually checked first. If the request matches any of these specific endpoints, it's forwarded to the express app running on port 3000. 
```
location ~ ^/(post|login|logout|oauth2/redirect/google) {
	proxy_pass http://localhost:3000;
	proxy_http_version 1.1;
	proxy_set_header Upgrade $http_upgrade;
	proxy_set_header Connection 'upgrade';
	proxy_set_header Host $host;
	proxy_cache_bypass $http_upgrade;
}
```

## Daemon
The nodejs app can be run however you prefer to run daemons on your system. A systemd unit file is included at `static-site-generator.service`.

## Configuration
The included `.env.example` can be copied to `.env` and the values replaced.

The javascript oauth library Passport is used to authenticate via Google account. You must set up an oauth2 client on the Google Developer Console in the Google Auth Platform and copy the credentials here:
```
GOOGLE_OAUTH_CLIENT_ID=12345ABCDE
GOOGLE_OAUTH_CLIENT_SECRET=12345ABCDE
```
The id of the user to whom you wish to allow post access:
```
GOOGLE_OAUTH_AUTHORIZED_USER_ID=12345ABCDE
```
A long random string to encrypt the session:
```
SESSION_SECRET=12345ABCDE
```
The path to your static files (where they should be generated):
```
PUBLIC_PATH=/var/www/example
```
The path to your source post JSON. This will be updated, and used to generate the site.
```
SOURCE_JSON=/usr/share/static-site-generator/blog.json
```

## Post data
The format of the source post JSON has the following structure. Note the three types and following related properties.
```json
[
  {
    "author": "John Blog",
    "createdAt": "2025-05-01T16:58:00Z",
    "type": "text",
    "text": "Hello, world."
  },
  {
    "author": "John Blog",
    "createdAt": "2025-05-02T10:58:00Z",
    "type": "song",
    "text": "Listen to this song https://youtu.be/vyut3GyQtn0",
    "artist": "Télépopmusik",
    "title": "Breathe"
  },
  {
    "author": "John Blog",
    "createdAt": "2025-05-03T20:38:00Z",
    "text": "A couple slappin' tunes:\nhttps://www.youtube.com/watch?v=i-SpGB6DtHw\nhttps://www.youtube.com/watch?v=mMWCQa-Gwv0",
    "type": "playlist",
    "tracks": [
      {
        "artist": "The One AM Radio",
        "title": "An Old Photo Of Your New Lover"
      },
      {
        "artist": "Kings of Convenience",
        "title": "Love Is No Big Truth"
      }
    ]
  }
]
```

## Usage

When the server is running, you can hit the `/login` endpoint to start the oauth flow. When authenticated, a form appears at the top of each page for posting.

Conversely `/logout` invalidates your session.

## CLI utility
If you need to generate the entire site from the terminal, e.g. if you change a template, you can run it like this:
```
node generate_site.js -u https://example.com -i blog.json -o /var/www/example
```