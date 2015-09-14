/*
Some methods derived from github.com/mpowaga/react-slider (MIT)
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

  handleKnobMove: function (index, pageX, event) {
    var grades = this.props.grades
    var lowerBoundIndex = this.state.lowerBoundIndex
    var upperBoundIndex = this.state.upperBoundIndex

    var left = React.findDOMNode(this.refs.grades).firstChild.getBoundingClientRect().left
    var right = React.findDOMNode(this.refs.grades).lastChild.getBoundingClientRect().right

    this.setState({left, right, pageX})

    var newIndex
    var mouseOrTouchLeftOfComponent = pageX <= left
    var mouseOrTouchRightOfComponent = pageX >= right

    if (mouseOrTouchLeftOfComponent) {
      newIndex = 0
    } else if (mouseOrTouchRightOfComponent) {
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

    if (newIndex < lowerBoundIndex) {
      this.setState({
        lowerBoundIndex: newIndex
      })
    } else if (newIndex > upperBoundIndex) {
      this.setState({
        upperBoundIndex: newIndex
      })
    } else if (newIndex > lowerBoundIndex && newIndex <= lowerBoundIndex + (upperBoundIndex - lowerBoundIndex) / 2) {
      this.setState({
        lowerBoundIndex: newIndex
      })
    } else if (newIndex < upperBoundIndex && newIndex > lowerBoundIndex + (upperBoundIndex - lowerBoundIndex) / 2) {
      this.setState({
        upperBoundIndex: newIndex
      })
    }
  },

  triggerChange: function () {
    var newGrades = this.props.grades.slice(this.state.lowerBoundIndex, this.state.upperBoundIndex)
    var newValues = newGrades.map(function (grade) {
      return grade.value
    })
    console.log('triggerChange', newValues)
    this.props.onChange(newValues)
  },

  determineBounds: function () {
    var values = this.props.values
    var grades = this.props.grades

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
    this.determineBounds()
  },

  componentWillReceiveProps: function () {
    this.determineBounds()
  },

  handleMoveIndexBackward: function (index) {
    if (this.state.lowerBoundIndex === index && index > 0) {
      return this.setState({
        lowerBoundIndex: this.state.lowerBoundIndex - 1
      })
    }

    if (this.state.upperBoundIndex === index && index > 1) {
      return this.setState({
        lowerBoundIndex: this.state.lowerBoundIndex === this.state.upperBoundIndex - 1 ? this.state.lowerBoundIndex - 1 : this.state.lowerBoundIndex,
        upperBoundIndex: this.state.upperBoundIndex - 1
      })
    }
  },

  handleMoveIndexForward: function (index) {
    if (this.state.lowerBoundIndex === index) {
      return this.setState({
        lowerBoundIndex: this.state.lowerBoundIndex + 1,
        upperBoundIndex: this.state.upperBoundIndex === this.state.lowerBoundIndex + 1 ? this.state.upperBoundIndex + 1 : this.state.upperBoundIndex
      })
    }

    if (this.state.upperBoundIndex === index && index < this.props.grades.length) {
      return this.setState({
        upperBoundIndex: this.state.upperBoundIndex + 1
      })
    }
  },

  handleMoveIndex: function (oldIndex, newIndex) {
    if (this.state.lowerBoundIndex === oldIndex && newIndex !== this.state.upperBoundIndex) {
      if (newIndex > this.state.upperBoundIndex) {
        this.setState({
          lowerBoundIndex: this.state.upperBoundIndex,
          upperBoundIndex: newIndex
        }, this.triggerChange) 
      } else {
        this.setState({
          lowerBoundIndex: newIndex
        }, this.triggerChange)        
      }
    } else if (this.state.upperBoundIndex === oldIndex && newIndex !== this.state.lowerBoundIndex) {
      if (newIndex < this.state.lowerBoundIndex) {
        this.setState({
          lowerBoundIndex: newIndex,
          upperBoundIndex: this.state.lowerBoundIndex
        }, this.triggerChange) 
      } else {
        this.setState({
          upperBoundIndex: newIndex
        }, this.triggerChange)  
      }
    }

    //this.triggerChange()
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
    
    var gradeComponents = grades.map(function (grade) {
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
    })

    var gradeCategories = grades.reduce(flattenCategories, [])

    var gradeCategoryComponents = gradeCategories.map(function (category, index) {
      return (
        React.createElement("div", {key: index, style: {flex: category.flex}, className: "gri-grade-category"}, 
          category.label
        )
      )
    })

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
            grades: this.props.grades, 
            onMove: this.handleKnobMove, 
            onDragEnd: this.handleDragEnd, 
            onMoveIndex: this.handleMoveIndex, 
            onMoveIndexBackward: this.handleMoveIndexBackward, 
            onMoveIndexForward: this.handleMoveIndexForward, 
            index: lowerBoundIndex}), 
          React.createElement("div", {className: "gri-knob-spacer", style: {flex: flexBetweenKnobs}}), 
          React.createElement(Knob, {
            grades: this.props.grades, 
            onMove: this.handleKnobMove, 
            onDragEnd: this.handleDragEnd, 
            onMoveIndex: this.handleMoveIndex, 
            onMoveIndexBackward: this.handleMoveIndexBackward, 
            onMoveIndexForward: this.handleMoveIndexForward, 
            index: upperBoundIndex, 
            upperBound: true}), 
          React.createElement("div", {className: "gri-knob-spacer", style: {flex: flexAfterSecondKnob}})
        )
        /* <pre className='gri-debug'>
          {JSON.stringify({
            lowerBoundIndex,
            upperBoundIndex,
            gradesLength: grades.length
          }, null, 2)}
        </pre> */
      )
    )
  }
})
