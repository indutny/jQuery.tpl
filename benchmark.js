(function () {
	var accum="";
	
	for (var i = 1E4;i>0;i--)
		accum += " similar {%= ' %1 ' %} are fun ";
	
	function test() {
		$.template( accum.replace(/%1/g , Math.random())   , {} , "tempname");
	}
	
	function benchmark(iterations) {
		var i = iterations, time, overall=0;
		
		for (;i>0;i--) {
			time = +new Date;
			
			test();
			
			time = +new Date - time;
			
			overall+=time;
		}
		
		$("<div>" + (overall /  iterations ) + " ms</div>").appendTo('body');
	}
	
	benchmark(1E2);
})();