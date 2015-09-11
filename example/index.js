var React = require('react')
var GradeRangeInput = require('../index')
var usGrades = require('../data/us')
var ukGrades = require('../data/uk')
var hkGrades = require('../data/hk')

var values = ['4','3','9']

function handleChange (newValues) {
  values = newValues
  console.log(newValues)
  render()
}
function render () {
  React.render(
    <div>
      <div>
        <h2>US</h2>
        <GradeRangeInput grades={usGrades} values={values} onChange={handleChange} />
      </div>
      <div>
        <h2>HK</h2>
        <GradeRangeInput grades={hkGrades} values={values} onChange={handleChange} />
      </div>
    </div>,
    document.getElementById('app')
  )
}

render()