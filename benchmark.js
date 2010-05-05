(function () {
	var accum="";
	
	for (var i = 1000;i>0;i--)
		accum += " similar {%= %1 %} are fun ";
	
	function test(str) {
		$.template( str );
	}
	
	function benchmark(tests) {
		var i = tests.length-1, time, overall=0;
		
		for (;i>=0;i--) {
			time = +new Date;
			
			test(tests[i]);
			
			time = +new Date - time;
			
			overall+=time;
		}
		
		$("<div>" + (overall /  tests.length ) + " ms</div>").appendTo('body');
	}
	var tests = [];
	for (var i =0;i<150;i++)
		tests[i] = accum.replace(/%1/g , i) ;
	
	$("<div>Tests created</div>").appendTo('body');
	setTimeout(function() {
		benchmark(tests);
	},13);
})();