
/*
Some methods derived from github.com/mpowaga/react-slider (MIT)
*/

var React = require('react')
var classnames = require('classnames')

var Divisions = React.createClass({
  displayName: 'Divisions',

  render: function () {
    return <div className='gri-division'></div>
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
    return <div onMouseDown={this.handleMouseDown} className={knobClasses}></div>
  }
})

module.exports = React.createClass({
  displayName: 'GradeRangeInput',

  propTypes: {
    grades: React.PropTypes.array,
    values: React.PropTypes.arrayOf(React.PropTypes.any)
  },

  /*
  getDefaultProps: function () {
    return {

    }
  },
  */

  getInitialState: function () {
    return {
      lowerBoundIndex: 5,
      upperBoundIndex: 8
    }
  },

  handleKnobMove: function (pageX, event) {
    var grades = this.props.grades
    var lowerBoundIndex = this.state.lowerBoundIndex
    var upperBoundIndex = this.state.upperBoundIndex

    var left = React.findDOMNode(this.refs.grades).firstChild.getBoundingClientRect().left
    var right = React.findDOMNode(this.refs.grades).lastChild.getBoundingClientRect().right

    var newIndex
    if (pageX <= left) {
      newIndex = 0
    } else if (pageX >= right) {
      newIndex = this.refs.grades.length
    } else {
      var flexTotal = grades.reduce(function (previousValue, currentValue) {
        return previousValue + currentValue.flex
      }, 0)

      var flexWidth = (right - left) / flexTotal
      var newFlex = Math.round(pageX / flexWidth)
      console.log({newFlex})

      newIndex = this.props.grades.reduce(function (previousValue, grade, index) {
        var cumulativeFlex = previousValue.previousFlex + grade.flex
        var middleFlex = previousValue.previousFlex + (grade.flex / 2)

        if (newFlex >= previousValue.previousFlex && newFlex <= middleFlex) {
          return {
            previousFlex: cumulativeFlex,
            index: index
          }
        }

        if (newFlex > middleFlex && newFlex <= previousValue.previousFlex + grade.flex) {
          return {
            previousFlex: cumulativeFlex,
            index: index + 1
          }
        }

        return {
          previousFlex: previousValue.previousFlex + grade.flex,
          index: previousValue.index
        }
      }, {
        previousFlex: 0,
        index: 0
      }).index
    }

    // console.log({
    //   newIndex,
    //   left,
    //   right,
    //   pageX
    // })

    if (newIndex <= lowerBoundIndex) {
      this.setState({
        lowerBoundIndex: newIndex
      })
    } else if (newIndex >= upperBoundIndex) {
      this.setState({
        upperBoundIndex: newIndex
      })
    } else if (newIndex <= lowerBoundIndex + (upperBoundIndex - lowerBoundIndex) / 2) {
      this.setState({
        lowerBoundIndex: newIndex
      })
    } else {
      this.setState({
        upperBoundIndex: newIndex
      })
    }
  },

  render: function () {
    var grades = this.props.grades
    var lowerBoundIndex = this.state.lowerBoundIndex
    var upperBoundIndex = this.state.upperBoundIndex

    // TODO: transform values props into bounds in state

    var flexTotal = grades.reduce(function (previousValue, currentValue) {
      return previousValue + currentValue.flex
    }, 0)

    var selectionBeforeFlex = lowerBoundIndex
    var selectionFlex = upperBoundIndex - lowerBoundIndex
    var selectionAfterFlex = flexTotal - upperBoundIndex

    console.debug({
      lowerBoundIndex,
      upperBoundIndex,
      flexTotal,
      selectionBeforeFlex,
      selectionFlex,
      selectionAfterFlex
    })
    
    var gradeComponents = grades.map(function (grade) {
      var label = grade.abbreviation || grade.label
      var flex = grade.flex || 1
      var styles = {
        flex: flex
      }

      var labelClassNames = classnames('gri-grade-label', grade.labelClassName)

      return (
        <div key={grade.value + grade.label} className='gri-grade' style={styles}>
          <div className='gri-grade-division'></div>
          <div className={labelClassNames}>
            {label}
          </div>
        </div>
      )      
    })

    var gradeCategories = grades.reduce(function (categories, grade) {
      var flex = grade.flex || 1
      var lastCategory = categories.length ? categories[categories.length - 1] : null
      var sameAsLastCategory = lastCategory && grade.category === lastCategory.label

      if (sameAsLastCategory) {
        categories[categories.length - 1].flex += flex
        return categories        
      }

      return categories.concat([{
        label: grade.category,
        flex: flex
      }])
    }, [])

    var gradeCategoryComponents = gradeCategories.map(function (category, index) {
      return (
        <div key={index} style={{flex: category.flex}} className='gri-grade-category'>
          {category.label}
        </div>
      )
    })

    return (
      <div ref='container' className='gri-container'>
        <div className='gri-axis'></div>
        <div className='gri-selection-container'>
          <div className='gri-selection-before' style={{flex: selectionBeforeFlex}}></div>
          <div className='gri-selection' style={{flex: selectionFlex}}>

          </div>
          <div className='gri-selection-after' style={{flex: selectionAfterFlex}}></div>
        </div>
        <div className='gri-grades' ref='grades'>
          {gradeComponents}
        </div>
        <div className='gri-grade-categories'>
          {gradeCategoryComponents}
        </div>
        <div className='gri-knobs'>
          <div style={{flex: selectionBeforeFlex, height: 5, backgroundColor: 'red'}}></div>
          <Knob onMove={this.handleKnobMove} />
          <div style={{flex: selectionAfterFlex + 3, height: 5, backgroundColor: 'blue'}}></div>
        </div>
        <pre className='gri-debug'>
          {JSON.stringify({
            selectionBeforeFlex,
            selectionAfterFlex,
            flexTotal
          }, null, 2)}
        </pre>
      </div>
    )
  }
})