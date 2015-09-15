
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
    // console.log('triggerChange', newValues)
    this.props.onChange(newValues)
  },

  determineBounds: function (props) {
    // console.log('determineBounds', props.values)
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
    // console.log('componentWillMount')
    this.determineBounds(this.props)
  },

  componentWillReceiveProps: function (nextProps) {
    // console.log('componentWillReceiveProps')
    this.determineBounds(nextProps)
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
    if (this.state.lowerBoundIndex === index && this.state.upperBoundIndex !== this.props.grades.length) {
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
            onDragEnd={this.handleDragEnd}
            onMoveIndex={this.handleMoveIndex}
            onMoveIndexBackward={this.handleMoveIndexBackward}
            onMoveIndexForward={this.handleMoveIndexForward}
            index={lowerBoundIndex} />
          <div className='gri-knob-spacer' style={{flex: flexBetweenKnobs}}></div>
          <Knob
            grades={this.props.grades}
            onMove={this.handleKnobMove}
            onDragEnd={this.handleDragEnd}
            onMoveIndex={this.handleMoveIndex}
            onMoveIndexBackward={this.handleMoveIndexBackward}
            onMoveIndexForward={this.handleMoveIndexForward}
            index={upperBoundIndex}
            upperBound={true} />
          <div className='gri-knob-spacer' style={{flex: flexAfterSecondKnob}}></div>
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