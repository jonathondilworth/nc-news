# nc-news

Backend API for a simple news application

See the live example hosted [here](https://nc-news-1fcj.onrender.com/api)

## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

The required software you need to use this project is listed below:

* node.js, see: [https://nodejs.org/](https://nodejs.org/)
* pSQL, see: [https://www.postgresql.org/](https://www.postgresql.org/)

*This project was built using psql v14.10 & node v21.2.0.*

### Installation

1. Clone the repo:
    ```sh
    git clone https://github.com/jonathondilworth/nc-news.git
    ```

2. Create your `.env.test` and `.env.development` files to reference the test and development databases:
   
   **.env.test:**
   ```
   PGDATABASE=nc_news_test
   ```
   **.env.development:**
   ```
   PGDATABASE=nc_news
   ```
   **.env.production:**
   ```
   DATABASE_URL=postgres://db.example.com/
   ```
   *Please check the .env-example file for a template on this projects environment variables.*

3. Install NPM packages:
   ```sh
   npm install
   ```

4. Initialise databases:
   ```sh
   npm run setup-dbs
   ```

5. Seed the development database:
   ```sh
   npm run seed
   ```

### Running Tests

```sh
npm run test
```

