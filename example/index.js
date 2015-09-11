var React = require('react')
var GradeRangeInput = require('../index')
var usGrades = require('../data/us')
var ukGrades = require('../data/uk')
var hkGrades = require('../data/hk')

var values = ['5','6','7']

React.render(
  <div>
    <div>
      <h2>US</h2>
      <GradeRangeInput grades={usGrades} values={values} />
    </div>
    {/* <div>
      <h2>HK</h2>
      <GradeRangeInput grades={hkGrades} values={values} />
    </div> */}
  </div>,
  document.getElementById('app')
)