/**
 * Дополнительные хелперы
 */
import 'classlist.js'
import classnames from 'classnames'
import domready from 'domready'
import throttle from 'lodash/throttle'
import forOwn from 'lodash/forOwn'
import EventEmitter from 'events'
import {scrollToTop} from './scroll'

const MutationObserver =
  window.MutationObserver ||
  window.WebKitMutationObserver ||
  window.MozMutationObserver ||
  ((callback) => {
    let interval
    return {
      observe() { interval = setInterval(callback, 2e3) },
      disconnect() { clearInterval(interval) }
    }
  })

/**
 * Создаем mutationObserver
 */
export const mutationEvents = new EventEmitter
export const mutationObserver = new MutationObserver((e) =>
  mutationEvents.emit('mutation', e)
)

/**
 * Следим за scroll окно
 */
export const viewportEvents = new EventEmitter
const onViewportChangeHandler = throttle((e) => (viewportEvents.emit('change', e)), 150)
window.addEventListener('scroll', onViewportChangeHandler)
window.addEventListener('resize', onViewportChangeHandler)

/**
 * Обработчик удаления элемента из DOM
 * @param {HTMLElement} element - DOM-элемент, который отслеживаем
 * @param {Function} callback - Функция-обработчик
 */
export function onRemoveFromDOM(element, callback) {
  if (isElementInDOM(element))
    mutationEvents.on('mutation', onMutation)

  function onMutation() {
    if (!isElementInDOM(element)) {
      mutationEvents.removeListener('mutation', onMutation)
      callback()
    }
  }
}

/**
 * Удаляет элемент из DOM, если он есть в DOM
 * @param  {HTMLElement} element - DOM-элемент
 */
export function removeFromDOM(element) {
  if (element.parentNode)
    element.parentNode.removeChild(element)
}

export function isElementInDOM(element) {
  return document.body.contains(element)
}

/**
 * Проверяет, находится ли элемент в видимой области экрана (если элемент выше видимой части, считается что он в ней)
 * @param {HTMLElement} element - Элемент
 * @param {Number} offset - Оффсет
 * @return {Boolean}
 */
export function inViewport(element, offset) {
  return element.getBoundingClientRect().top - offset < window.innerHeight
}

/**
 * Выставить класс элементу
 * @param {HTMLElement} element - DOM элемент
 * @param {...[String|Object]} classNames - css-классы
 */
export function setClass(element, ...classNames) {
  if (element)
    element.className = classnames(...classNames)
}

/**
 * Добавить класс элементу
 * @param {HTMLElement} element - DOM элемент
 * @param {...[String|Object]} classNames - css-классы
 */
export function addClass(element, ...classNames) {
  if (element)
    element.classList.add(...classnames(...classNames).trim().split(/\s+/))
}

/**
 * Удалить класс у элемента
 * @param {HTMLElement} element - DOM элемент
 * @param {...[String|Object]} classNames - css-классы
 */
export function removeClass(element, ...classNames) {
  if (element)
    element.classList.remove(...classnames(...classNames).trim().split(/\s+/))
}

/**
 * Добавить/удалить классы у элемента
 * @param {HTMLElement} element - DOM элемент
 * @param {...[String|Object]} classNames - классы для добавления/удаления
 * @param {Boolean} [remove] - флаг, указывающий добавить или удалить класс
 *
 * @example
 * toggleClass(element, {'my-class': true, 'other-class': false}) // удалить класс 'other-class' и добавить класс 'my-class'
 * toggleClass(element, 'my-class', true) // добавить класс 'my-class'
 * toggleClass(element, ['my-class', 'other-class'], false) // удалить классы 'my-class', 'other-class'
 */
export function toggleClass(element, ...args) {
  const [add, ...classNames] = args.reverse()
  if (typeof add !== 'boolean')
    forOwn(args[0], (v, k) => {
      if (v)
        addClass(element, k)
      else
        removeClass(element, k)
    })
  else
    if (add)
      addClass(element, ...classNames)
    else
      removeClass(element, ...classNames)
}

/**
 * Найти DOM-элемент по его id
 * @param  {String} id - id искомого элемента
 * @param  {HTMLElement} [parent] - элемент, внутри которого нужно искать
 * @return {HTMLElement}
 */
export function findById(id, parent) {
  if (!parent)
    return document.getElementById(id)
  return parent.querySelector(`[id="${id}"]`)
}

/**
 * Подскроллить к позиции относительно верхнего левого угла элемента
 * @param {HTMLElement} element - DOM-элемент
 * @param {Number} top - отступ сверху относительно верхнего левого угла элемента
 * @param {Number} [duration = 50] - время анимации
 */
export function scrollByElementTo(element, top, duration = 200) {
  const parent = findScrollableParent(element)
  if (!parent || parent === element)
    return
  const {top: elementTop} = element.getBoundingClientRect()
  const {top: parentTop} = parent.getBoundingClientRect()
  const newScrollTop = elementTop - parentTop + top
  return scrollToTop(parent, newScrollTop, duration)
}

function findScrollableParent(element) {
  if (!element || document === document.documentElement)
    return document.documentElement
  if (element.scrollHeight > element.clientHeight ||
    element === document.body ||
    element === document.documentElement) {
    const overflowY = getComputedStyle(element).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll')
      return element
  }
  return findScrollableParent(element.parentNode)
}

domready(() => {
  const observedNode = document.body || document.documentElement
  mutationObserver.observe(observedNode, {childList: true, subtree: true})
})
