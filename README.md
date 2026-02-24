# geo-clipper2

This is a set of polygon clipping and offsetting operations, originally based off of (clipper2)[https://github.com/AngusJohnson/Clipper2].
The port of Clipper2 is limited to Clipper64 and inflatePaths, with a focus on the int64 implementations.

Included with the ported code are additional tools to help operate on GeoJSON.

## Usage

The package provides several methods and one class that expose all of the existing functionality.
There are also several enumerations and some TypeScript types to help support.

The easiest way to get started is to use the JSDoc comments. You probably want to start with `inflatePaths` or `Clipper64`.
If you're using GeoJSON data, you'll need to project it to an integer space using `createAzimuthalEquidistantProjection` first.

## Motivation

While other libraries exist to do this, the handling of the conversion from Clipper2's expected
Int64 types into JavaScript numbers can be quite tricky where we only have ~2^53.

Additionally, geospatial coordinates require very specific handling to preserve precision
during these operations. Creating this library gives us the ability to bundle tricky supporting
code to handle GeoJSON with Clipper2's integer-based algorithms.

By making a custom implementation we can also discard codepaths that we do not need, such as handling
Doubles and any Z axis coordinates.

## Known issues

- Buffering and projection at the poles probably doesn't work as expected without special treatment in the unproject step.
- Public API is not yet stable, specifically Clipper64 may receive changes and clipping at the antimeridian will be added
