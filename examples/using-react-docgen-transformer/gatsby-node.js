const path = require(`path`)

exports.createPages = ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators

  return new Promise((resolve, reject) => {
    resolve(
      Promise.all([
        graphql(`
          {
            allComponentMetadata {
              edges {
                node {
                  displayName
                  props {
                    name
                    type {
                      value
                      raw
                      name
                    }
                    description {
                      text
                    }
                    required
                  }
                }
              }
            }
          }
        `),
        graphql(`
          {
            allMarkdownRemark(
              filter: { fileAbsolutePath: { regex: "/README.md/" } }
            ) {
              edges {
                node {
                  fileAbsolutePath
                  html
                }
              }
            }
          }
        `),
      ])
        .then(([result, result2]) => {
          console.log(result2.data.allMarkdownRemark.edges)

          if (result.errors) {
            reject(new Error(result.errors))
            return
          }

          const componentTemplate = path.resolve(`src/templates/component.js`)
          const indexTemplate = path.resolve(`src/templates/index.js`)
          const allComponents = result.data.allComponentMetadata.edges.map(
            edge =>
              Object.assign({}, edge.node, {
                path: `/components/${edge.node.displayName.toLowerCase()}/`,
              })
          )

          allComponents.forEach(data => {
            const { path } = data
            const context = Object.assign({}, data, {
              allComponents,
            })
            createPage({
              path,
              component: componentTemplate,
              context,
            })
          })

          createPage({
            path: `/components/`,
            component: indexTemplate,
            context: {
              allComponents,
            },
          })
        })
        .catch(err => {
          console.log(err)
          throw new Error(err)
        })
    )
  })
}
