/*
Some patterns derived from github.com/mpowaga/react-slider (MIT)
*/

var React = require('react')
var classnames = require('classnames')
var flattenCategories = require('./lib/flatten-categories')
var accumulateFlex = require('./lib/accumulate-flex')
var Knob = require('./knob')

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
      var gradeNodesArray = Array.from(gradeNodes) // TODO: use polyfill for Array.from
      var currentNode = gradeNodesArray.find(function (node) {
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
      })
    }

    if (upperBoundIndex === index && index > 1) {
      return this.setState({
        lowerBoundIndex: lowerBoundIndex === upperBoundIndex - 1 ? lowerBoundIndex - 1 : lowerBoundIndex,
        upperBoundIndex: upperBoundIndex - 1
      })
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
      })
    }

    if (upperBoundIndex === index && index < grades.length) {
      return this.setState({
        upperBoundIndex: upperBoundIndex + 1
      })
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
      React.createElement("div", {ref: "container", className: "gri-container"}, 
        React.createElement("div", {className: "gri-axis"}), 
        React.createElement("div", {className: "gri-selection-container"}, 
          React.createElement("div", {className: "gri-selection-before", style: {flex: flexBeforeFirstKnob}}), 
          React.createElement("div", {className: "gri-selection", style: {flex: flexBetweenKnobs}}), 
          React.createElement("div", {className: "gri-selection-after", style: {flex: flexAfterSecondKnob}})
        ), 
        React.createElement("div", {className: "gri-grades", ref: "grades"}, 
          gradeComponents
        ), 
        React.createElement("div", {className: "gri-grade-categories"}, 
          gradeCategoryComponents
        ), 
        React.createElement("div", {className: "gri-knobs"}, 
          React.createElement("div", {className: "gri-knob-spacer", style: {flex: flexBeforeFirstKnob}}), 
          React.createElement(Knob, {
            options: this.props.grades, 
            onPointerMove: this.handlePointerMove, 
            onDragEnd: this.handleDragEnd, 
            onMoveIndex: this.handleMoveIndex, 
            onMoveIndexBackward: this.handleMoveIndexBackward, 
            onMoveIndexForward: this.handleMoveIndexForward, 
            index: lowerBoundIndex}), 
          React.createElement("div", {className: "gri-knob-spacer", style: {flex: flexBetweenKnobs}}), 
          React.createElement(Knob, {
            options: this.props.grades, 
            onPointerMove: this.handlePointerMove, 
            onDragEnd: this.handleDragEnd, 
            onMoveIndex: this.handleMoveIndex, 
            onMoveIndexBackward: this.handleMoveIndexBackward, 
            onMoveIndexForward: this.handleMoveIndexForward, 
            index: upperBoundIndex, 
            isUpperBound: true}), 
          React.createElement("div", {className: "gri-knob-spacer", style: {flex: flexAfterSecondKnob}})
        ), 
        React.createElement("pre", {className: "gri-debug"}, 
          JSON.stringify({
            lowerBoundIndex,
            upperBoundIndex,
            gradesLength: grades.length
          }, null, 2)
        )
      )
    )
  }
})

function createGradeCategoryComponent (category, index) {
  return (
    React.createElement("div", {key: index, style: {flex: category.flex}, className: "gri-grade-category"}, 
      category.label
    )
  )
}

function createGradeComponent (grade) {
  var label = grade.abbreviation || grade.label
  var flex = grade.flex || 1
  var styles = {
    flex: flex
  }

  var labelClassNames = classnames('gri-grade-label', grade.labelClassName)

  return (
    React.createElement("div", {key: grade.value + grade.label, className: "gri-grade", style: styles}, 
      React.createElement("div", {className: "gri-grade-division"}), 
      React.createElement("div", {className: labelClassNames}, 
        label
      )
    )
  )      
}
