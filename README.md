# nc-news

Backend API for a simple news application

## Getting Started

To get a local copy up and running follow these simple example steps.

*Note: these instructions are currently for developers wishing to contribute; and as such, information regarding the testing and development databases is included below.*

### Prerequisites

The required software you need to use this project is listed below:

* node.js, see: [https://nodejs.org/](https://nodejs.org/)
* pSQL, see: [https://www.postgresql.org/](https://www.postgresql.org/)

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