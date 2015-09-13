/*
Some methods derived from github.com/mpowaga/react-slider (MIT)
*/

var React = require('react')
var classnames = require('classnames')

var Divisions = React.createClass({
  displayName: 'Divisions',

  render: function () {
    return React.createElement("div", {className: "gri-division"})
  }
})

function pauseEvent(e) {
  if (e.stopPropagation) e.stopPropagation()
  if (e.preventDefault) e.preventDefault()
  e.cancelBubble = true
  e.returnValue = false
  return false
}

var Knob = React.createClass({
  displayName: 'Knob',

  propTypes: {
    // onMove: React.PropTypes.function
  },

  getInitialState: function () {
    return {
      dragging: false
    }
  },

  getMouseEventMap: function () {
    return {
      'mousemove': this.handleMouseMove,
      'mouseup': this.handleMouseUp
    }
  },

  handleMouseDown: function (event) {
    this.setState({
      dragging: true
    })
    pauseEvent(event)
    this.addHandlers(this.getMouseEventMap())
  },

  handleMouseUp: function () {
    this.handleDragEnd(this.getMouseEventMap())
  },

  handleDragEnd: function (eventMap) {
    this.removeHandlers(eventMap)
    this.setState({
      dragging: false
    })
  },

  handleMouseMove: function (event) {
    pauseEvent(event)
    var position = this.getMousePosition(event)
    this.props.onMove(position[0], event)
  },

  getMousePosition: function (event) {
    return [
      event['pageX'],
      event['pageY']
    ]
  },

  addHandlers: function (eventMap) {
    for (var key in eventMap) {
      document.addEventListener(key, eventMap[key], false)
    }
  },

  removeHandlers: function (eventMap) {
    for (var key in eventMap) {
      document.removeEventListener(key, eventMap[key], false)
    }
  },

  render: function () {
    var knobClasses = classnames('gri-knob', {
      'gri-knob-dragging': this.state.dragging
    })
    return React.createElement("div", {onMouseDown: this.handleMouseDown, className: knobClasses})
  }
})

module.exports = React.createClass({
  displayName: 'GradeRangeInput',

  propTypes: {
    grades: React.PropTypes.array,
    values: React.PropTypes.arrayOf(React.PropTypes.any)
  },

  getInitialState: function () {
    return {
      lowerBoundIndex: 5,
      upperBoundIndex: 8,
      left: null,
      pageX: null,
      right: null
    }
  },

  handleKnobMove: function (pageX, event) {
    var grades = this.props.grades
    var lowerBoundIndex = this.state.lowerBoundIndex
    var upperBoundIndex = this.state.upperBoundIndex

    var left = React.findDOMNode(this.refs.grades).firstChild.getBoundingClientRect().left
    var right = React.findDOMNode(this.refs.grades).lastChild.getBoundingClientRect().right

    this.setState({left, right, pageX})

    var newIndex
    if (pageX <= left) {
      newIndex = 0
    } else if (pageX >= right) {
      newIndex = grades.length
    } else {

      var flexTotal = grades.reduce(accumulateFlex, 0)

      var gradeNodes = React.findDOMNode(this.refs.grades).childNodes
      var gradeNodesArray = Array.from(gradeNodes)
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
      }, this.triggerChange)
    } else if (newIndex > upperBoundIndex) {
      this.setState({
        upperBoundIndex: newIndex
      }, this.triggerChange)
    } else if (newIndex > lowerBoundIndex && newIndex <= lowerBoundIndex + (upperBoundIndex - lowerBoundIndex) / 2) {
      this.setState({
        lowerBoundIndex: newIndex
      }, this.triggerChange)
    } else if (newIndex < upperBoundIndex && newIndex > lowerBoundIndex + (upperBoundIndex - lowerBoundIndex) / 2) {
      this.setState({
        upperBoundIndex: newIndex
      }, this.triggerChange)
    }
  },

  triggerChange: function () {
    var newGrades = this.props.grades.slice(this.state.lowerBoundIndex, this.state.upperBoundIndex)
    var newValues = newGrades.map(function (grade) {
      return grade.value
    })
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
          React.createElement(Knob, {onMove: this.handleKnobMove}), 
          React.createElement("div", {className: "gri-knob-spacer", style: {flex: flexBetweenKnobs}}), 
          React.createElement(Knob, {onMove: this.handleKnobMove}), 
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

function accumulateFlex (flex, grade) {
  return flex + grade.flex
}

function flattenCategories (categories, grade) {
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
