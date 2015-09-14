
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
    onMove: React.PropTypes.func,
    upperBound: React.PropTypes.bool,
    index: React.PropTypes.number
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
    this.props.onMove(this.props.index, position[0], event)
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

  handleKeyDown: function (event) {
    var isLeftArrow = event.which === 37
    var isRightArrow = event.which === 39
    if (isLeftArrow && this.props.onMoveIndexBackward) {
      this.props.onMoveIndexBackward(this.props.index)
    }

    if (isRightArrow && this.props.onMoveIndexForward) {
      this.props.onMoveIndexForward(this.props.index)
    }
  },

  handleClick: function (event) {
    React.findDOMNode(this.refs.select).focus()
  },

  handleSelectChange: function (event) {
    this.props.onMoveIndex(this.props.index, Number(event.target.value) + Number(this.props.upperBound || 0))
  },

  handleSelectFocus: function (event) {
    this.setState({focus: true})
  },

  handleSelectBlur: function (event) {
    this.setState({focus: false})
  },

  render: function () {
    var knobClasses = classnames('gri-knob', {
      'gri-knob-dragging': this.state.dragging,
      'gri-knob-focus': this.state.focus
    })

    var options = this.props.grades.map(function (grade, index) {
      return (
        <option
            key={grade.value}
            value={index}>
          {grade.label || grade.abbreviation}
        </option>
      )
    }.bind(this))

    return (
      <div
          ref='div'
          onMouseDown={this.handleMouseDown}
          onClick={this.handleClick}
          className={knobClasses}
          onFocus={this.handleSelectFocus}
          onBlur={this.handleSelectBlur}>
        <select
            ref='select'
            value={this.props.index - Number(this.props.upperBound || 0)}
            className='gri-screenreader-only'
            onKeyDown={this.handleKeyDown}
            onChange={this.handleSelectChange}
            tabIndex={0}>
          {options}
        </select>
      </div>
    )
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
        }) 
      } else {
        this.setState({
          lowerBoundIndex: newIndex
        })        
      }
    } else if (this.state.upperBoundIndex === oldIndex && newIndex !== this.state.lowerBoundIndex) {
      if (newIndex < this.state.lowerBoundIndex) {
        this.setState({
          lowerBoundIndex: newIndex,
          upperBoundIndex: this.state.lowerBoundIndex
        }) 
      } else {
        this.setState({
          upperBoundIndex: newIndex
        })  
      }
    }

    //this.triggerChange()
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
        <div key={grade.value + grade.label} className='gri-grade' style={styles}>
          <div className='gri-grade-division'></div>
          <div className={labelClassNames}>
            {label}
          </div>
        </div>
      )      
    })

    var gradeCategories = grades.reduce(flattenCategories, [])

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
          <div className='gri-selection-before' style={{flex: flexBeforeFirstKnob}}></div>
          <div className='gri-selection' style={{flex: flexBetweenKnobs}}></div>
          <div className='gri-selection-after' style={{flex: flexAfterSecondKnob}}></div>
        </div>
        <div className='gri-grades' ref='grades'>
          {gradeComponents}
        </div>
        <div className='gri-grade-categories'>
          {gradeCategoryComponents}
        </div>
        <div className='gri-knobs'>
          <div className='gri-knob-spacer' style={{flex: flexBeforeFirstKnob}}></div>
          <Knob
            grades={this.props.grades}
            onMove={this.handleKnobMove}
            onMoveIndex={this.handleMoveIndex}
            onMoveIndexBackward={this.handleMoveIndexBackward}
            onMoveIndexForward={this.handleMoveIndexForward}
            index={lowerBoundIndex} />
          <div className='gri-knob-spacer' style={{flex: flexBetweenKnobs}}></div>
          <Knob
            grades={this.props.grades}
            onMove={this.handleKnobMove}
            onMoveIndex={this.handleMoveIndex}
            onMoveIndexBackward={this.handleMoveIndexBackward}
            onMoveIndexForward={this.handleMoveIndexForward}
            index={upperBoundIndex}
            upperBound={true} />
          <div className='gri-knob-spacer' style={{flex: flexAfterSecondKnob}}></div>
        </div>
        {/* <pre className='gri-debug'>
          {JSON.stringify({
            lowerBoundIndex,
            upperBoundIndex,
            gradesLength: grades.length
          }, null, 2)}
        </pre> */}
      </div>
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