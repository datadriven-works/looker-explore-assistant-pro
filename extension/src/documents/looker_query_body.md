Here's a detailed table of instructions for the fields in a Looker `run_inline_query` API request, followed by some examples.

---

### Table of Instructions

| **Field**           | **Description**                                                                                   | **Example Value**                                 |
|----------------------|---------------------------------------------------------------------------------------------------|--------------------------------------------------|
| `model`             | The Looker data model to query.                                                                  | `"thelook"`                                      |
| `view`              | The view within the specified model to query.                                                    | `"inventory_items"`                              |
| `fields`            | Array of fields to retrieve from the query.                                                      | `["category.name", "inventory_items.stock"]`     |
| `filters`           | Key-value pairs to filter the data returned.                                                     | `{"category.name": "shoes"}`                     |
| `sorts`             | List of fields and sort directions for ordering the results.                                      | `["products.count desc"]`                        |
| `limit`             | The maximum number of rows to return.                                                            | `"500"`                                         |
| `query_timezone`    | Time zone for interpreting time-based fields in the query.                                        | `"America/Los_Angeles"`                          |
| `dynamic_fields`    | JSON string for defining calculated fields dynamically in the query.                              | `[{"type": "number", "expression": "sales * 2"}]` |
| `filter_expression` | SQL-like expression for more complex filters.                                                    | `"inventory_items.days_in_inventory_tier > 30"` |
| `pivot_fields`      | Array of fields to pivot the results on.                                                          | `["category.name"]`                              |

---

### Examples of JSON Requests

1. Retrieve sales count grouped by category:
   ```json
   {
     "model": "ecommerce",
     "view": "sales",
     "fields": ["category.name", "sales.count"],
     "sorts": ["sales.count desc"],
     "limit": "100",
     "query_timezone": "UTC"
   }
   ```

2. Filter by category and region:
   ```json
   {
     "model": "thelook",
     "view": "orders",
     "fields": ["category.name", "orders.total"],
     "filters": {"region": "west", "category.name": "clothing"},
     "sorts": ["orders.total desc"],
     "limit": "50",
     "query_timezone": "America/New_York"
   }
   ```

3. Use dynamic fields:
   ```json
   {
     "model": "thelook",
     "view": "sales",
     "fields": ["sales.count"],
     "dynamic_fields": "[{\"type\": \"number\", \"expression\": \"revenue * 1.1\"}]",
     "limit": "20",
     "query_timezone": "UTC"
   }
   ```

4. Pivot on category:
   ```json
   {
     "model": "ecommerce",
     "view": "inventory",
     "fields": ["category.name", "inventory.stock"],
     "pivot_fields": ["category.name"],
     "limit": "100"
   }
   ```

5. Query with filter expression:
   ```json
   {
     "model": "retail",
     "view": "inventory",
     "fields": ["inventory_items.stock", "products.name"],
     "filter_expression": "inventory_items.stock > 100",
     "limit": "10"
   }
   ```

# Comprehensive Guide to `filter_expression` in Looker API

The `filter_expression` parameter in the Looker API is a powerful tool for creating complex filtering logic in queries. Unlike simple filters, `filter_expression` provides a SQL-like syntax that allows for nuanced and intricate conditions. This document will guide you through its usage with examples and best practices.

---

## **What is `filter_expression`?**

The `filter_expression` parameter allows you to specify custom filter conditions in your Looker queries using SQL-like syntax. These conditions are evaluated in the context of your Looker model, providing fine-grained control over the data returned by your queries.

### **Key Features**

- **SQL-like syntax:** Familiar operators and structure for database professionals.
- **Complex logical expressions:** Combine multiple conditions with `AND`, `OR`, and parentheses.
- **Advanced filters:** Use operators like `IN`, `NOT`, and `LIKE` for granular filtering.
- **Null handling:** Include or exclude null values explicitly.

---

## **Syntax Overview**

### **Field References**
Fields must be specified in the format `view_name.field_name`. For example:
```json
"filter_expression": "orders.total > 100"
```

### **Supported Operators**

| **Operator** | **Description**                     | **Example**                             |
|--------------|-------------------------------------|-----------------------------------------|
| `=`          | Equal to                            | `category.name = 'Electronics'`        |
| `!=`         | Not equal to                        | `category.name != 'Clothing'`          |
| `<`          | Less than                           | `orders.total < 500`                   |
| `>`          | Greater than                        | `orders.total > 100`                   |
| `<=`         | Less than or equal to               | `orders.total <= 500`                  |
| `>=`         | Greater than or equal to            | `orders.total >= 100`                  |
| `IN`         | Matches a list of values            | `category.name IN ('Shoes', 'Bags')`   |
| `NOT`        | Negates a condition                 | `NOT orders.cancelled`                 |
| `LIKE`       | Matches a pattern with wildcards    | `products.name LIKE 'Smart%'`          |
| `IS NULL`    | Checks if a value is null           | `orders.ship_date IS NULL`             |
| `IS NOT NULL`| Checks if a value is not null       | `orders.ship_date IS NOT NULL`         |

### **Logical Operators**

| **Operator** | **Description** | **Example**                                        |
|--------------|-----------------|--------------------------------------------------|
| `AND`        | Combines conditions (both true)   | `orders.total > 100 AND category.name = 'Shoes'` |
| `OR`         | Combines conditions (either true) | `orders.total > 100 OR category.name = 'Bags'`  |
| `()`         | Groups conditions                 | `(orders.total > 100 AND category.name = 'Shoes') OR orders.total <= 50` |

### **Special Functions**

- **CURRENT_DATE:** Represents the current date.
- **DATE_ADD:** Adds a specified interval to a date.
- **INTERVAL:** Defines time intervals (e.g., `'30' DAY`).

---

## **Usage Examples**

Here are 20 examples of `filter_expression` for various scenarios:

### **1. Basic Equality**
Filter for orders with a total greater than 100:
```json
"filter_expression": "orders.total > 100"
```

### **2. Filtering by Category**
Filter for specific product categories:
```json
"filter_expression": "category.name IN ('Electronics', 'Clothing')"
```

### **3. Combining Conditions with AND**
Filter for high-value orders in the "Shoes" category:
```json
"filter_expression": "orders.total > 500 AND category.name = 'Shoes'"
```

### **4. Using OR**
Filter for orders in "Electronics" or "Clothing":
```json
"filter_expression": "category.name = 'Electronics' OR category.name = 'Clothing'"
```

### **5. Negation**
Exclude canceled orders:
```json
"filter_expression": "NOT orders.cancelled"
```

### **6. Null Check**
Include only orders with a ship date:
```json
"filter_expression": "orders.ship_date IS NOT NULL"
```

### **7. Pattern Matching with LIKE**
Filter for products starting with "Smart":
```json
"filter_expression": "products.name LIKE 'Smart%'"
```

### **8. Date Range**
Orders placed in the last 30 days:
```json
"filter_expression": "orders.order_date >= CURRENT_DATE - INTERVAL '30' DAY"
```

### **9. Combining Logical Operators**
Filter for specific conditions:
```json
"filter_expression": "(orders.total > 100 AND category.name = 'Shoes') OR (orders.total <= 50 AND category.name = 'Bags')"
```

### **10. Greater Than with Date**
Filter for recent orders:
```json
"filter_expression": "orders.created_at > '2024-01-01'"
```

### **11. Using CURRENT_DATE**
Filter for orders created today:
```json
"filter_expression": "orders.created_at = CURRENT_DATE"
```

### **12. Not Equal**
Exclude specific regions:
```json
"filter_expression": "customers.region != 'North America'"
```

### **13. IN with Multiple Values**
Filter for orders in specific states:
```json
"filter_expression": "orders.state IN ('CA', 'NY', 'TX')"
```

### **14. Less Than or Equal**
Filter for orders under 100:
```json
"filter_expression": "orders.total <= 100"
```

### **15. Null Inclusion**
Include only records with null values:
```json
"filter_expression": "orders.ship_date IS NULL"
```

### **16. Greater Than with Interval**
Filter for orders older than 6 months:
```json
"filter_expression": "orders.created_at < CURRENT_DATE - INTERVAL '6' MONTH"
```

### **17. Combining Multiple Filters**
Filter for orders matching complex criteria:
```json
"filter_expression": "(orders.total > 200 AND orders.ship_date IS NOT NULL) OR category.name = 'Furniture'"
```

### **18. Nested Conditions**
Filter using nested logic:
```json
"filter_expression": "((orders.total > 500 AND orders.state = 'CA') OR orders.state = 'NY') AND orders.ship_date IS NOT NULL"
```

### **19. String Matching**
Filter for product names containing "Pro":
```json
"filter_expression": "products.name LIKE '%Pro%'"
```

### **20. Exclude Null Values with Complex Logic**
Filter for specific orders and exclude nulls:
```json
"filter_expression": "(orders.total > 100 AND category.name = 'Shoes') AND orders.ship_date IS NOT NULL"
```

---

## **Best Practices**

1. **Validate Syntax:** Always test your `filter_expression` in the Looker Explore UI before deploying it in your API queries.
2. **Use Descriptive Field Names:** Ensure fields are named clearly in your Looker model to avoid confusion.
3. **Optimize Conditions:** Avoid overly complex expressions that may impact query performance.
4. **Leverage Date Functions:** Use functions like `CURRENT_DATE` and `INTERVAL` for dynamic date filtering.

---

By using `filter_expression`, you can unlock the full potential of Looker queries and tailor data retrieval to your exact needs.

