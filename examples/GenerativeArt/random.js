// @method   randomInt
// @author   Tim Greller
// @param  [ {Number} minimum (included) default =   0 ]
//         [ {Number} maximum (included) default = 100 ]
//           when only one number is passed, the range will be [0;max]
// @return   {Number} a random Integer between the two values
function randomInt( min=NaN,max=NaN )
{
    if( Number.isNaN(min) ) // no number is passed
    {
        min = 0;
        max = 100;
    }
    else if( Number.isNaN(max) ) // only one number is passed
    {
        max = min;
        min = 0;
    }
    
    return (
        Math.round(   // rounds to the next integer value
        Math.random() // random number in the range [0;1[
        * (max-min)   // the number of possible Integers
        +  min        // adding the minimum
        )
    );
}