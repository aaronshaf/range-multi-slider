var React = require('react')
var GradeRangeInput = require('../index')
var usGrades = require('../data/us')
var ukGrades = require('../data/uk')
var hkGrades = require('../data/hk')

var values = ['3','4','5']

function handleChange (newValues) {
  console.log('handleChange')
  values = newValues
  render(values)
}
function render (values) {
  React.render(
    <div>
      <div>
        <h2>US</h2>
        <GradeRangeInput grades={usGrades} values={values} onChange={handleChange} />
      </div>
      <div>
        <h2>UK</h2>
        <GradeRangeInput grades={ukGrades} values={values} onChange={handleChange} />
      </div>
      <div>
        <h2>HK</h2>
        <GradeRangeInput grades={hkGrades} values={values} onChange={handleChange} />
      </div>
    </div>,
    document.getElementById('app')
  )
}

render(values)