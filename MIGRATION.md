# Localicious Migration

### From 0.9.x to 1.0.x

Previously, we only allowed fixed groups (IOS|ANDROID|SHARED) in the Localicipe root. By introducing `collections` in Localicious v1.0.0, we're giving the user more control by letting them define their own groups. Collections can have any name and can be rendered in any output-type (`android`|`ios`|`js`).

This is a breaking change, which means that existing commands need to be updated.
Previously, all Android strings could be rendered using:
`localicious render ./copy.yaml ./output_path --platforms android --languages en`

Using Localicious v1.0.x, the same result can be achieved by changing the command to:
`localicious render ./copy.yaml ./output_path --outputTypes android --languages en --collections ANDROID,SHARED`

As you can see, `platforms` is renamed to `outputTypes`, and the new parameter `collections` is provided to specifiy which collections should be included in the output.