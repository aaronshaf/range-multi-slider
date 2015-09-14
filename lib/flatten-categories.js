module.exports = function flattenCategories (categories, grade) {
  var flex = grade.flex || 1
  var lastCategory = categories.length ? categories[categories.length - 1] : null
  var sameAsLastCategory = lastCategory && grade.category === lastCategory.label

  if (sameAsLastCategory) {
    // TODO: don't mutate
    categories[categories.length - 1].flex += flex
    return categories        
  }

  return categories.concat([{
    label: grade.category,
    flex: flex
  }])
}