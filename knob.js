var classnames = require('classnames')
var pauseEvent = require('./lib/pause-event')

var React = require('react')

module.exports = React.createClass({
  displayName: 'Knob',

  propTypes: {
    options: React.PropTypes.array,
    onMove: React.PropTypes.func,
    onDragEnd: React.PropTypes.func,
    onMoveIndex: React.PropTypes.func,
    onMoveIndexBackward: React.PropTypes.func,
    onMoveIndexForward: React.PropTypes.func,
    index: React.PropTypes.number,
    isUpperBound: React.PropTypes.bool
  },

  getInitialState: function () {
    return {
      dragging: false,
      focus: false
    }
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return nextProps.index !== this.props.index ||
        nextState.dragging !== this.state.dragging ||
        nextState.focus !== this.state.focus
  },

  getMouseEventMap: function () {
    return {
      'mousemove': this.handleMouseMove,
      'mouseup': this.handleMouseUp
    }
  },

  handleMouseDown: function (event) {
    this.setState({
      dragging: true,
      focus: true
    })
    pauseEvent(event)
    this.addHandlers(this.getMouseEventMap())
    React.findDOMNode(this.refs.select).focus()
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
    var position = this.getMousePosition(event)
    this.props.onPointerMove(this.props.index, position[0], event)
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
    var index = this.props.index
    var isLeftArrow = event.which === 37
    var isRightArrow = event.which === 39

    if (isLeftArrow && this.props.onMoveIndexBackward) {
      this.props.onMoveIndexBackward(index)
    }

    if (isRightArrow && this.props.onMoveIndexForward) {
      this.props.onMoveIndexForward(index)
    }
  },

  handleSelectChange: function (event) {
    var isUpperBound = this.props.isUpperBound
    var index = this.props.index
    this.props.onMoveIndex(index, Number(event.target.value) + Number(isUpperBound || 0))
  },

  handleSelectFocus: function (event) {
    this.setState({focus: true})
  },

  handleSelectBlur: function (event) {
    this.setState({focus: false})
  },

  render: function () {
    var options = this.props.options

    var knobClasses = classnames('gri-knob', {
      'gri-knob-dragging': this.state.dragging,
      'gri-knob-focus': this.state.focus
    })

    var optionComponents = options.map(function (option, index) {
      return (
        React.createElement("option", {
            key: option.value, 
            value: index}, 
          option.label || option.abbreviation
        )
      )
    }.bind(this))

    return (
      React.createElement("div", {
          ref: "div", 
          onMouseDown: this.handleMouseDown, 
          className: knobClasses}, 
        React.createElement("select", {
            ref: "select", 
            value: this.props.index - Number(this.props.upperBound || 0), 
            className: "gri-screenreader-only", 
            onKeyDown: this.handleKeyDown, 
            onChange: this.handleSelectChange, 
            onFocus: this.handleSelectFocus, 
            onBlur: this.handleSelectBlur, 
            tabIndex: 0}, 
          optionComponents
        )
      )
    )
  }
})
