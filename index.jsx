
/*
Some patterns derived from github.com/mpowaga/react-slider (MIT)
*/

var React = require('react')
var classnames = require('classnames')
var flattenCategories = require('./lib/flatten-categories')
var accumulateFlex = require('./lib/accumulate-flex')
var flexStyles = require('./lib/flex-styles')
var toArray = require('./lib/to-array')
var Knob = require('./knob')
var find = require('lodash/collection/find')

module.exports = React.createClass({
  displayName: 'GradeRangeInput',

  propTypes: {
    grades: React.PropTypes.array,
    values: React.PropTypes.arrayOf(React.PropTypes.any)
  },

  getInitialState: function () {
    return {
      lowerBoundIndex: 0,
      upperBoundIndex: 1,
      left: null,
      pageX: null,
      right: null
    }
  },

  // shouldComponentUpdate: function (nextProps, nextState) {
  //   return nextProps.values !== this.props.values // assumes immutability
  // },

  handlePointerMove: function (index, pageX, event) {
    var grades = this.props.grades
    var lowerBoundIndex = this.state.lowerBoundIndex
    var upperBoundIndex = this.state.upperBoundIndex
    var isLowerKnob = lowerBoundIndex === index
    var isUpperKnob = upperBoundIndex === index
    var left = React.findDOMNode(this.refs.grades).firstChild.getBoundingClientRect().left
    var right = React.findDOMNode(this.refs.grades).lastChild.getBoundingClientRect().right
    var pointerLeftOfComponent = pageX <= left
    var pointerRightOfComponent = pageX >= right

    this.setState({left, right, pageX}) // for debug?

    var newIndex

    if (pointerLeftOfComponent) {
      newIndex = 0
    } else if (pointerRightOfComponent) {
      newIndex = grades.length
    } else {
      var flexTotal = grades.reduce(accumulateFlex, 0)

      var gradeNodes = React.findDOMNode(this.refs.grades).childNodes
      var gradeNodesArray = toArray(gradeNodes)
      var currentNode = find(gradeNodesArray, function (node) {
        var left = React.findDOMNode(node).firstChild.getBoundingClientRect().left
        var right = React.findDOMNode(node).lastChild.getBoundingClientRect().right
        return pageX >= left && pageX <= right
      })
      var indexOfCurrentNode = gradeNodesArray.indexOf(currentNode)

      var left = React.findDOMNode(currentNode).firstChild.getBoundingClientRect().left
      var right = React.findDOMNode(currentNode).lastChild.getBoundingClientRect().right
      var middle = left + ((right - left) / 2)
      if(pageX <= middle) {
        newIndex = indexOfCurrentNode
      } else { 
        newIndex = indexOfCurrentNode + 1
      }
    }

    this.handleMoveIndex(index, newIndex)
  },

  triggerChange: function () {
    var lowerBoundIndex = this.state.lowerBoundIndex
    var upperBoundIndex = this.state.upperBoundIndex
    var grades = this.props.grades

    var newGrades = grades.slice(lowerBoundIndex, upperBoundIndex)
    var newValues = newGrades.map(function (grade) {
      return grade.value
    })
    this.props.onChange(newValues)
  },

  determineBounds: function (props) {
    var values = props.values
    var grades = props.grades

    var lowerBoundIndex = grades.reduce(function (lowerBoundIndex, grade, index) {
      var gradeIncludedInValues = values.indexOf(grade.value) > -1
      if (gradeIncludedInValues && lowerBoundIndex === -1) {
        return index
      }
      return lowerBoundIndex
    }, -1)

    var upperBoundIndex = grades.reduceRight(function (upperBoundIndex, grade, index) {
      if (values.indexOf(grade.value) > -1 && !upperBoundIndex) {
        return index + 1
      }
      return upperBoundIndex
    }, 0)

    this.setState({
      lowerBoundIndex,
      upperBoundIndex: upperBoundIndex || grades.length
    })
  },

  componentWillMount: function () {
    this.determineBounds(this.props)
  },

  componentWillReceiveProps: function (nextProps) {
    this.determineBounds(nextProps)
  },

  handleMoveIndexBackward: function (index) {
    var lowerBoundIndex = this.state.lowerBoundIndex
    var upperBoundIndex = this.state.upperBoundIndex

    if (lowerBoundIndex === index && index > 0) {
      return this.setState({
        lowerBoundIndex: lowerBoundIndex - 1
      }, this.triggerChange)
    }

    if (upperBoundIndex === index && index > 1) {
      return this.setState({
        lowerBoundIndex: lowerBoundIndex === upperBoundIndex - 1 ? lowerBoundIndex - 1 : lowerBoundIndex,
        upperBoundIndex: upperBoundIndex - 1
      }, this.triggerChange)
    }
  },

  handleMoveIndexForward: function (index) {
    var lowerBoundIndex = this.state.lowerBoundIndex
    var upperBoundIndex = this.state.upperBoundIndex
    var grades = this.props.grades

    if (lowerBoundIndex === index && upperBoundIndex !== grades.length) {
      return this.setState({
        lowerBoundIndex: lowerBoundIndex + 1,
        upperBoundIndex: upperBoundIndex === lowerBoundIndex + 1 ? upperBoundIndex + 1 : upperBoundIndex
      }, this.triggerChange)
    }

    if (upperBoundIndex === index && index < grades.length) {
      return this.setState({
        upperBoundIndex: upperBoundIndex + 1
      }, this.triggerChange)
    }
  },

  handleMoveIndex: function (oldIndex, newIndex) {
    var lowerBoundIndex = this.state.lowerBoundIndex
    var upperBoundIndex = this.state.upperBoundIndex

    if (lowerBoundIndex === oldIndex && newIndex !== upperBoundIndex) {
      if (newIndex > upperBoundIndex) {
        this.setState({
          lowerBoundIndex: upperBoundIndex,
          upperBoundIndex: newIndex
        }, this.triggerChange) 
      } else {
        this.setState({
          lowerBoundIndex: newIndex
        }, this.triggerChange)        
      }
    } else if (upperBoundIndex === oldIndex && newIndex !== lowerBoundIndex) {
      if (newIndex < lowerBoundIndex) {
        this.setState({
          lowerBoundIndex: newIndex,
          upperBoundIndex: lowerBoundIndex
        }, this.triggerChange) 
      } else {
        this.setState({
          upperBoundIndex: newIndex
        }, this.triggerChange)  
      }
    }
  },

  handleDragEnd: function () {
    this.triggerChange()
  },

  render: function () {
    var grades = this.props.grades
    var lowerBoundIndex = this.state.lowerBoundIndex
    var upperBoundIndex = this.state.upperBoundIndex

    var flexTotal = grades.reduce(accumulateFlex, 0)
    var flexBeforeFirstKnob = grades.slice(0, lowerBoundIndex).reduce(accumulateFlex, 0)
    var flexBetweenKnobs = grades.slice(lowerBoundIndex, upperBoundIndex).reduce(accumulateFlex, 0)
    var flexAfterSecondKnob = grades.slice(upperBoundIndex).reduce(accumulateFlex, 0)

    // console.debug({
    //   lowerBoundIndex,
    //   upperBoundIndex,
    //   flexBetweenKnobs,
    //   flexTotal,
    //   flexBeforeFirstKnob,
    //   flexAfterSecondKnob,
    //   gradesLength: grades.length
    // })
    
    var gradeComponents = grades.map(createGradeComponent)
    var gradeCategories = grades.reduce(flattenCategories, [])
    var gradeCategoryComponents = gradeCategories.map(createGradeCategoryComponent)

    return (
      <div ref='container' className='gri-container'>
        <div className='gri-axis'></div>
        <div className='gri-selection-container'>
          <div className='gri-selection-before' style={flexStyles(flexBeforeFirstKnob)}></div>
          <div className='gri-selection' style={flexStyles(flexBetweenKnobs)}></div>
          <div className='gri-selection-after' style={flexStyles(flexAfterSecondKnob)}></div>
        </div>
        <div className='gri-grades' ref='grades'>
          {gradeComponents}
        </div>
        <div className='gri-grade-categories'>
          {gradeCategoryComponents}
        </div>
        <div className='gri-knobs'>
          <div className='gri-knob-spacer' style={flexStyles(flexBeforeFirstKnob)}></div>
          <Knob
            options={this.props.grades}
            onPointerMove={this.handlePointerMove}
            onDragEnd={this.handleDragEnd}
            onMoveIndex={this.handleMoveIndex}
            onMoveIndexBackward={this.handleMoveIndexBackward}
            onMoveIndexForward={this.handleMoveIndexForward}
            index={lowerBoundIndex} />
          <div className='gri-knob-spacer' style={flexStyles(flexBetweenKnobs)}></div>
          <Knob
            options={this.props.grades}
            onPointerMove={this.handlePointerMove}
            onDragEnd={this.handleDragEnd}
            onMoveIndex={this.handleMoveIndex}
            onMoveIndexBackward={this.handleMoveIndexBackward}
            onMoveIndexForward={this.handleMoveIndexForward}
            index={upperBoundIndex}
            isUpperBound={true} />
          <div className='gri-knob-spacer' style={flexStyles(flexAfterSecondKnob)}></div>
        </div>
        <pre className='gri-debug'>
          {JSON.stringify({
            lowerBoundIndex,
            upperBoundIndex,
            gradesLength: grades.length
          }, null, 2)}
        </pre>
      </div>
    )
  }
})

function createGradeCategoryComponent (category, index) {
  return (
    <div key={index} style={flexStyles(category.flex)} className='gri-grade-category'>
      {category.label}
    </div>
  )
}

function createGradeComponent (grade) {
  var label = grade.abbreviation || grade.label
  var flex = grade.flex || 1
  var styles = flexStyles(flex)

  var labelClassNames = classnames('gri-grade-label', grade.labelClassName)

  return (
    <div
        key={grade.value + grade.label}
        className='gri-grade'
        style={styles}
        title={grade.label}>
      <div className='gri-grade-division'></div>
      <div className={labelClassNames}>
        {label}
      </div>
    </div>
  )      
}