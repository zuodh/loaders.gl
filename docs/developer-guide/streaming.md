# Streaming Support

> Streaming support in loaders.gl is a work-in-progress. The ambition is that many loaders would support streaming from both Node and DOM streams, through a consistent API and set of conventions (for both applications and loader/writer objects).


## Definitions of Streaming

Streaming refers to:
* reading and/or parsing a single, large data set incrementally
* writing and/or encoding a single, large data set incrementally.
* the ability to chain streams to do partial reading, local processing on a chunk, write partial result.

Advantages
* Avoiding loading all data into memory before staring parsing
* Avoid encoding entire output in memory when it can be written in batches
* For data formats where partial chunks of data are meaningful to the application, support incremental loading/display


### Incremental Parsing

Some loaders offer incremental parsing (chunks of incomplete data can be parsed, and updates will be sent after a certain batch size has been exceeded). In many cases, parsing is fast compared to loading of data, so incremental parsing on its own may not provide a lot of value for applications.


### Incremental Loading

Incremental parsing becomes more interesting when it can be powered by incremental loading, whether through request updates or streams (see below).


### Streamed Loading

Streamed loading means that the entire data does not need to be loaded.

This is particularly advantageous when:
* loading files with sizes that exceed browser limits (e.g. 1GB in Chrome)
* doing local processing to files (tranforming one row at a time), this allows pipe constructions that can process files that far exceed internal memory.


## Batched Updates

For incemental loading and parsing to be really effective, the application needs to be able to deal efficiently with partial batches as they arrive. Each loader category (or loader) may define a batch update conventions that are appropriate for the format being loaded.


## Streaming Writes

TBA
