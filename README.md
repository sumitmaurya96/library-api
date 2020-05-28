# Library Api

library-api is a express, Nodejs api.

## Envoirnment Variables

```r
DB_LINK=<MONGODB_LINK>
TOKEN_ENCRYPTION_KEY=<YOUR ENCRYPTION KEY>
SUPERUSER_KEY=<SUPERUSER KEY>
DEFAULT_ADMIN_PASSWORD=<DEFAULT ADMIN KEY>
```

## Api Requests

#### Api has 5 routes "Books", "Users" , "Admins", "Notices", "Favourites", "Orders", Each routes serves corrosponding database query

### Books

#### Book data format

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
  "longDescription": "This book contain information about computer science",
  "price": 400.95
}

//Updoad Thumbnail and then thumbnailUrl property got added in this json data
```

#### Get Books by text query

```js
  https://localhost:5000/books/search/<Query Parameters>

  #Query Parameters
    #1 query=string    //Ex- query=Graph Theory
    #2 exact=boolean    //If true, Return exact match to your search
    #3 limit=number    //Maximum result to return
    #4 excludes=string    //Match to be excluded, Ex- excludes=Theory
    #5 limit=number    //Maximum result to return
    #6 pageNumber=number    //page Number of result
    #7 pageSize=number    //size of page
```

##### Examples

```js
    https://localhost:5000/books/search/query=Graph Theory&limit=10
```

##### gives most relevent result according to match

```js
```
