# About Apache Arrow

> The material in this section is assembled from various Apache Arrow docs.

References:

* [Apache Arrow JavaScript API Implementation](https://github.com/trxcllnt/arrow/tree/js/data-builders/js).
* Documentation about the Apache Arrow JavaScript API is still thin. If you are familiar with Python it might be useful to look at the [pyarrow](https://arrow.apache.org/docs/python/index.html) docs.


## Data Types

* Fixed-length primitive types: numbers, booleans, date and times, fixed size binary, decimals, and other values that fit into a given number
* Variable-length primitive types: binary, string
* Nested types: list, struct, and union
* Dictionary type: An encoded categorical type


## About Columnar Tables

Columnar tables are stored as one array per column. Columns that are numeric are loaded as typed arrays. These can be efficiently transferred from worker threads to main thread and also be directly uploaded to the GPU for further processing.


### Dictionary Arrays

The Dictionary type is a special array type that is similar to a factor in R or a pandas.Categorical in Python. It enables one or more record batches in a file or stream to transmit integer indices referencing a shared dictionary containing the distinct values in the logical array. This is particularly often used with strings to save memory and improve performance.

### RecordBatch

A Record Batch in Apache Arrow is a collection of equal-length array instances.

Let’s consider a collection of arrays:

```
In [66]: data = [
   ....:     pa.array([1, 2, 3, 4]),
   ....:     pa.array(['foo', 'bar', 'baz', None]),
   ....:     pa.array([True, None, False, True])
   ....: ]
   ....: 
```

A record batch can be created from this list of arrays using RecordBatch.from_arrays:

### Tables

The JavaScript `Table` type is not part of the Apache Arrow specification, but is rather a tool to help with wrangling multiple record batches and array pieces as a single logical dataset. As a relevant example, we may receive multiple small record batches in a socket stream, then need to concatenate them into contiguous memory for use in NumPy or pandas. The Table object makes this efficient without requiring additional memory copying.


Considering the record batch we created above, we can create a Table containing one or more copies of the batch using `Table.from_batches()`:

```
 const table = pa.Table.from_batches(batches)
```


The table’s columns are instances of Column, which is a container for one or more arrays of the same type.



### AsyncByteStream

### RecordBatchReader

### Schema, DataType,

### Utf8Vector


### FloatVector

### RecordBatchStreamWriter

