type CompareFn<T> = (a: T, b: T) => 1 | 0 | -1;

export default class Heap<T> {
  #heap: T[] = [];

  constructor(private compareFn: CompareFn<T>) {}
  
  size() {
    return this.#heap.length;
  }

  push(value: T) {
    const heap = this.#heap;
    heap.push(value);

    let curr = heap.length - 1;

    while(curr > 0){
      let parent = Math.floor((curr-1)/2);
      if(this.compareFn(heap[parent], heap[curr]) >= 0) {
        break;
      }
      [ heap[curr], heap[parent] ] = [ heap[parent], heap[curr] ];
        curr = parent
    } 
  }

  pop() {
    const heap = this.#heap;
    const n = heap.length;
    [heap[0], heap[n-1]] = [ heap[n-1], heap[0]]

    const removedKey = heap.pop();

    let curr = 0;

    while(2*curr + 1 < heap.length){
      const leftIndex = 2*curr+1; 
      const rightIndex = 2*curr+2;
      const minChildIndex = (rightIndex < heap.length && heap[rightIndex] < heap[leftIndex] ) ? rightIndex :leftIndex;

      if(this.compareFn(heap[curr], heap[minChildIndex]) >= 0) {
        break;
      }
      [heap[minChildIndex], heap[curr]] = [heap[curr], heap[minChildIndex]];
      curr = minChildIndex;
    }

    return removedKey;
  }

  clone() {
    const h = new Heap(this.compareFn);
    h.#heap = [...this.#heap];
    return h;
  }
}