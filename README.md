# Test

## Sample usage:

```javascript
var test = require('u-test'),
    assert = require('assert');

test('Array',function(){
  
  test('#indexOf()',function(){
    
    test('should return -1 when the value is not present',function(){
      
      assert([1,2,3].indexOf(5) == -1);
      assert([1,2,3].indexOf(0) == -1);
      
    });
    
  });
  
});
```
