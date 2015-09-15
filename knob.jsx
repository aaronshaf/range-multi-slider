var classnames = require('classnames')
var pauseEvent = require('./lib/pause-event')

var React = require('react')

module.exports = React.createClass({
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
    this.props.onDragEnd()
  },

  handleMouseMove: function (event) {
    pauseEvent(event)
    React.findDOMNode(this.refs.select).focus()
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