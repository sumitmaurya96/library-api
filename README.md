# Library Api

library-api is a express, Nodejs api

## Envoirnment Variables

```r
DB_LINK=mongodb://<username>:<password>@cluster0-shard-00-00-hn6kk.mongodb.net:27017,cluster0-shard-00-01-hn6kk.mongodb.net:27017,cluster0-shard-00-02-hn6kk.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority

TOKEN_ENCRYPTION_KEY=<YOUR ENCRYPTION KEY>
SUPERUSER_KEY=<SUPERUSER KEY>
DEFAULT_ADMIN_PASSWORD=<DEFAULT ADMIN KEY>
```

## Book data format and properties

```json
{
  "title": "THE ROUND EARTH",
  "isbn": "23NJV45780",
  "issn": "34TSVRJ",
  "classNo": "2L590",
  "bookNo": "459078234TM",
  "accessionNo": "B1295L",
  "authors": ["HC VERMA", "SAURAV SHUKLA"],
  "categories": ["PHYSICS", "COMPUTER SCIENCE"],
  "dateOfPurchase": 25 - 3 - 2012,
  "edition": "9",
  "pageCount": 297,
  "ebookUrl": "http://localhost:5000",
  "publication": "Perason",
  "status": "Published",
  "shortDescription": "A Computer Science Book",
  "longDescription": "This book contain lots of information about universal forces in nature",
  "price": 400.95
}
```
